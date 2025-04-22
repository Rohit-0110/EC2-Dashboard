from fastapi import FastAPI, APIRouter, HTTPException
from pydantic import BaseModel
import logging
import boto3
from datetime import datetime, timedelta
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:3000",  # for React frontend for example
]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,              # or ["*"] to allow all origins
    allow_credentials=True,
    allow_methods=["*"],                # GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],                # Authorization, Content-Type, etc.
)


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define the router
router = APIRouter(
    prefix="/api/aws",
    responses={404: {"description": "Not Found"}},
)

region = 'us-east-1'
cache = {}
CACHE_EXPIRATION = timedelta(minutes=5)


class CreateInstanceRequest(BaseModel):
    name: str
    owner: str
    instance_type: str
    department: str
    imageid: str
    is_spot: bool = True

#LIST INSTANCES
@router.get("/")
async def get_instances(page: int = 1, page_size: int = 10, force_refresh: bool = False):
    ec2client = boto3.client('ec2', region_name=region)
    cache_key = "all_instances"

    # Force refresh if requested or cache is expired
    if force_refresh or cache_key not in cache or (datetime.now() - cache[cache_key]['timestamp']) > CACHE_EXPIRATION:
        paginator = ec2client.get_paginator('describe_instances')
        instances_list = []

        # Fetch all instances (no state filter)
        for page_data in paginator.paginate():
            for reservation in page_data['Reservations']:
                for instance in reservation['Instances']:
                    tags = {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}
                    instances_list.append({
                        'instance_id': instance['InstanceId'],
                        'instance_type': instance.get('InstanceType'),
                        'created_at': instance.get('LaunchTime').isoformat(),
                        'public_ip': instance.get('PublicIpAddress'),
                        'ip': instance.get('PrivateIpAddress'),
                        'tags': tags,
                        'name': tags.get('Name'),
                        'description': tags.get('Purpose'),
                        'owner': tags.get('Owner'),
                        'power_state': instance['State']['Name'],  # Include the instance state
                        'os': instance.get('Platform') or 'linux',
                    })

        cache[cache_key] = {
            'timestamp': datetime.now(),
            'data': instances_list
        }

    # Sort and paginate
    instances_list = cache[cache_key]['data']
    instances_list.sort(key=lambda x: x['created_at'], reverse=True)
    total_instances = len(instances_list)
    start_index = (page - 1) * page_size
    end_index = min(start_index + page_size, total_instances)

    return {
        "current_page": page,
        "total_pages": (total_instances // page_size) + 1,
        "total_instances": total_instances,
        "instances": instances_list[start_index:end_index],
        "next_page": f"?page={page + 1}&page_size={page_size}" if end_index < total_instances else None,
        "prev_page": f"?page={page - 1}&page_size={page_size}" if page > 1 else None
    }

DEFAULT_SUBNET_ID = "subnet-04994ce549ac2726d"
DEFAULT_SECURITY_GROUP_IDS = ["sg-095dd87b3313efe7f"]

#FUNCTION OF CREATE INSTANCE 
def create_instance(name, owner, department, instance_type, imageid, is_spot=True, 
                   subnet_id=DEFAULT_SUBNET_ID, security_group_ids=DEFAULT_SECURITY_GROUP_IDS):
    tag_specifications = [
        {
            "ResourceType": "instance",
            "Tags": [
                {"Key": "Name", "Value": str(name)},
                {"Key": "Owner", "Value": str(owner)},
                {"Key": "Department", "Value": str(department)},
            ],
        }
    ]

    market_options = {
        "MarketType": "spot",
        "SpotOptions": {
            "MaxPrice": "7.6",
            "SpotInstanceType": "one-time",
        },
    }

    ec2 = boto3.resource("ec2")
    try:
        if is_spot:
            instances = ec2.create_instances(
                ImageId=imageid,
                InstanceType=instance_type,
                SubnetId=subnet_id,
                MinCount=1,
                MaxCount=1,
                SecurityGroupIds=security_group_ids,
                KeyName="rohit",
                TagSpecifications=tag_specifications,
                InstanceMarketOptions=market_options,
            )
        else:
            instances = ec2.create_instances(
                ImageId=imageid,
                InstanceType=instance_type,
                SubnetId=subnet_id,
                MinCount=1,
                MaxCount=1,
                SecurityGroupIds=security_group_ids,
                KeyName="rohit",
                TagSpecifications=tag_specifications,
            )

        instance = instances[0]
        instance.wait_until_running()
        instance.reload()
        return instance

    except Exception as e:
        logger.error(f"Failed to create EC2 instance: {e}")
        raise

#CREATE INSTANCE
@router.post("/create")
async def create_ec2_instance(request: CreateInstanceRequest):
    logger.info(f"Received request: {request}")
    try:
        instance = create_instance(
            name=request.name,
            owner=request.owner,
            instance_type=request.instance_type,
            department=request.department,
            is_spot=request.is_spot,
            imageid=request.imageid
        )
        return {
            "message": "EC2 instance created successfully",
            "instance_id": instance.id,
            "instance_ip": instance.private_ip_address
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

#INSTANCE STATUS
@router.post("/status")
def get_instance_status(instance_id: str):
    try:
        ec2_client = boto3.client('ec2', region_name=region)
        response = ec2_client.describe_instances(InstanceIds=[instance_id])
        instance_state = response['Reservations'][0]['Instances'][0]['State']['Name']
        return {"status": instance_state}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

#START INSTANCE
@router.post("/start")
def start_instance(instance_id: str):
    try:
        ec2_client = boto3.client('ec2', region_name=region)
        ec2_client.start_instances(InstanceIds=[instance_id])
        return {"message": f"Instance {instance_id} started successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

#STOP INSTANCE
@router.post("/stop")
def stop_instance(instance_id: str):
    try:
        ec2_client = boto3.client('ec2', region_name=region)
        ec2_client.stop_instances(InstanceIds=[instance_id])
        return {"message": f"Instance {instance_id} stopped successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

#TERMINATE INSTANCE
@router.post("/terminate")
def terminate_instance(instance_id: str):
    try:
        ec2_client = boto3.client('ec2', region_name=region)
        ec2_client.terminate_instances(InstanceIds=[instance_id])
        return {"message": f"Instance {instance_id} terminated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
# FETCH AMIS WITH SPECIFIC TAGS
@router.get("/amis/")
def list_amis():
    try:
        ec2_client = boto3.client('ec2', region_name=region)
        amis_response = ec2_client.describe_images(
            Filters=[
                {'Name': 'tag:Dashboard', 'Values': ['cloud']}      #TAG: { "Dashboard":"cloud"}
            ],
            Owners=['self']
        )
        amis = []
        for image in amis_response.get('Images', []):
            ami_info = {
                'image_id': image.get('ImageId'),
                'name': image.get('Name'),
                'description': image.get('Description'),
                'creation_date': image.get('CreationDate'),
                'state': image.get('State'),
                'architecture': image.get('Architecture'),
                'image_type': image.get('ImageType'),
                'platform_details': image.get('PlatformDetails'),
                'usage_operation': image.get('UsageOperation'),
                'tags': {tag['Key']: tag['Value'] for tag in image.get('Tags', [])},
            }
            amis.append(ami_info)

        return {
            "amis": amis
        }
    except Exception as e:
        logger.error(f"Failed to list AMIs: {e}")
        raise HTTPException(status_code=400, detail=str(e))
 
#CREATE KEY-PAIR
class PublicKeyModel(BaseModel):
    key_name: str
    public_key_material: str

@router.post("/createkey")
def import_key_pair(payload: PublicKeyModel):
    try:
        ec2 = boto3.client('ec2')
        response = ec2.import_key_pair(
            KeyName=payload.key_name,
            PublicKeyMaterial=payload.public_key_material.encode('utf-8')
        )
        return {"message": "Key pair imported successfully", "key_fingerprint": response["KeyFingerprint"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




app.include_router(router)
