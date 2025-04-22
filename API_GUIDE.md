# 🐍 Python API – AWS Instance Management

## ⚙️ Setup Backend

```bash
# Navigate to the API directory
cd api

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the API server
uvicorn instances:app --host 0.0.0.0 --reload
```

# 🚀 API Endpoints – Testing with cURL
Use the following curl commands to interact with the API.

## 📋 List All Instances
```bash
curl --location 'http://localhost:8000/api/aws'
```
## 🆕 Create a New Instance
```bash
curl --location 'http://localhost:8000/api/aws/create' \
--header 'Content-Type: application/json' \
--data '{
  "name": "rohit",
  "owner": "rohit",         
  "instance_type": "t2.micro",
  "department": "IT",
  "is_spot": false,
  "imageid": "ami-084568db4383264d4"
}'
```

## ▶️ Start an Instance
```bash
# Replace with your actual instance ID
curl --location --request POST 'http://localhost:8000/api/aws/start?instance_id=i-0f105a66e145ad40f'
```

## ⏹️ Stop an Instance
```bash
# Replace with your actual instance ID
curl --location --request POST 'http://localhost:8000/api/aws/stop?instance_id=i-0f105a66e145ad40f'
```

## ℹ️ Check Instance Status
```bash
# Replace with your actual instance ID
curl --location 'http://localhost:8000/api/aws/status?instance_id=i-0f105a66e145ad40f'
```

## ❌ Terminate an Instance
```bash
# Replace with your actual instance ID
curl --location --request POST 'http://localhost:8000/api/aws/terminate?instance_id=i-0f105a66e145ad40f'
```

## 📦 Fetch Available AMIs
```bash
# Lists only AMIs tagged with: "Dashboard": "cloud"
curl --location 'http://localhost:8000/api/aws/amis'
```

## 🔐 Create a Key Pair
```bash
curl --location 'http://localhost:8000/api/aws/createkey' \
--header 'Content-Type: application/json' \
--data-raw '{
    "key_name": "test",
    "public_key_material": "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDD1Gkjsc8Av/xFC0MJM/sesai/MHFjNY3tCHrKjIAhMYsCot/bIb7gZ0o+wG65ETyz....." 
}'
# Replace the "public_key_material" value with your actual SSH public key
```
