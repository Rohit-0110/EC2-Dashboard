import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Table,
  Button,
  Form,
  Modal,
  Spinner,
  ToggleButtonGroup,
  ToggleButton,
  Toast,
  Badge,
  Card,
  Row,
  Col,
} from 'react-bootstrap';
import { PencilSquare, PlusCircle, ArrowRepeat, Trash, Play, Stop } from 'react-bootstrap-icons';
import EditButton from './components/EditButton';
import './App.css';

const App = () => {
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [newInstance, setNewInstance] = useState({
    name: '',
    owner: '',
    instance_type: 't2.micro',
    department: '',
    imageid: '',
    is_spot: true,
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');
  const [amis, setAmis] = useState([]);
  const [loadingAmis, setLoadingAmis] = useState(false);
  const [showConfirmTerminateModal, setShowConfirmTerminateModal] = useState(false);
  const [instanceToTerminate, setInstanceToTerminate] = useState(null);
  const [actionError, setActionError] = useState('');
  const [showActionErrorToast, setShowActionErrorToast] = useState(false);

  const fetchInstances = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/api/aws/?force_refresh=true');
      console.log('Backend Response:', response.data);
      setInstances(response.data.instances);
    } catch (error) {
      console.error('Error fetching instances:', error.response ? error.response.data : error.message);
      setToastMessage('Error fetching instances: ' + (error.response ? error.response.data : error.message));
      setToastVariant('danger');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchAmis = async () => {
    setLoadingAmis(true);
    try {
      const response = await axios.get('http://localhost:8000/api/aws/amis/');
      console.log('AMIs Response:', response.data);
      setAmis(response.data.amis);
    } catch (error) {
      console.error('Error fetching AMIs:', error.response ? error.response.data : error.message);
      setToastMessage('Error fetching AMIs: ' + (error.response ? error.response.data : error.message));
      setToastVariant('danger');
      setShowToast(true);
    } finally {
      setLoadingAmis(false);
    }
  };

  useEffect(() => {
    fetchInstances();
  }, []);

  useEffect(() => {
    if (showCreateModal) {
      fetchAmis();
    }
  }, [showCreateModal]);

  const handleCreateInstance = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/aws/create', newInstance);
      console.log('Create Instance Response:', response.data);
      setShowCreateModal(false);
      fetchInstances();
      setToastMessage('Instance created successfully!');
      setToastVariant('success');
      setShowToast(true);
    } catch (error) {
      console.error('Error creating instance:', error.response ? error.response.data : error.message);
      setToastMessage('Error creating instance: ' + (error.response ? error.response.data : error.message));
      setToastVariant('danger');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const pollInstanceStatus = async (instanceId, desiredState) => {
    try {
      let currentState = '';
      while (currentState !== desiredState) {
        const response = await axios.get(`http://localhost:8000/api/aws/status?instance_id=${instanceId}`);
        currentState = response.data.status;
        if (currentState === desiredState) break;
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      fetchInstances();
    } catch (error) {
      console.error('Error polling instance status:', error.response ? error.response.data : error.message);
    }
  };

  const handleInstanceAction = async (action, instanceId) => {
    setActionLoading(true);
    try {
      await axios.post(`http://localhost:8000/api/aws/${action}?instance_id=${instanceId}`);
      const desiredState = action === 'start' ? 'running' : action === 'stop' ? 'stopped' : 'terminated';
      if (action !== 'terminate') {
        await pollInstanceStatus(instanceId, desiredState);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        fetchInstances();
      }
      setShowEditModal(false);
    } catch (error) {
      console.error(`Error ${action}ing instance:`, error.response ? error.response.data : error.message);
      setActionError(`Failed to ${action} instance: ${error.response ? error.response.data : error.message}`);
      setShowActionErrorToast(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmTerminate = async () => {
    setActionLoading(true);
    try {
      await axios.post(`http://localhost:8000/api/aws/terminate?instance_id=${instanceToTerminate}`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      fetchInstances();
      setShowConfirmTerminateModal(false);
      setToastMessage('Instance terminated successfully!');
      setToastVariant('success');
      setShowToast(true);
    } catch (error) {
      console.error('Error terminating instance:', error.response ? error.response.data : error.message);
      setToastMessage('Error terminating instance: ' + (error.response ? error.response.data : error.message));
      setToastVariant('danger');
      setShowToast(true);
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (instance) => {
    setSelectedInstance(instance);
    setShowEditModal(true);
  };

  return (
    <Container fluid className="p-4">
      {/* Header */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="align-items-center">
            <Col>
              <h1 className="mb-0">EC2 Instance Dashboard</h1>
            </Col>
            <Col className="text-end">
              <Button variant="light" onClick={fetchInstances} disabled={loading} className="btn-custom">
                {loading ? (
                  <Spinner animation="border" size="sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                ) : (
                  <ArrowRepeat size={20} />
                )}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Create Instance Button */}
      <Button variant="success" onClick={() => setShowCreateModal(true)} className="btn-custom mb-4">
        <PlusCircle size={20} className="me-2" />
        Create New Instance
      </Button>

      {/* Instance Table */}
      {loading ? (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <Card className="shadow-sm">
          <Card.Body>
            <Table striped bordered hover className="table-custom mb-0">
              <thead>
                <tr>
                  <th>Instance ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>State</th>
                  <th>Public IP</th>
                  <th>Private IP</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {instances.map((instance) => (
                  <tr key={instance.instance_id}>
                    <td>{instance.instance_id}</td>
                    <td>{instance.name}</td>
                    <td>{instance.instance_type}</td>
                    <td>
                      <Badge
                        bg={
                          instance.power_state === 'running'
                            ? 'success'
                            : instance.power_state === 'stopped'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {instance.power_state}
                      </Badge>
                    </td>
                    <td>{instance.public_ip}</td>
                    <td>{instance.ip}</td>
                    <td>
                      <EditButton instance={instance} onEdit={openEditModal} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Create Instance Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton className="modal-header">
          <Modal.Title>Create New EC2 Instance</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={newInstance.name}
                onChange={(e) => setNewInstance({ ...newInstance, name: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Owner</Form.Label>
              <Form.Control
                type="text"
                value={newInstance.owner}
                onChange={(e) => setNewInstance({ ...newInstance, owner: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Instance Type</Form.Label>
              <Form.Control
                type="text"
                value={newInstance.instance_type}
                onChange={(e) => setNewInstance({ ...newInstance, instance_type: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Department</Form.Label>
              <Form.Control
                type="text"
                value={newInstance.department}
                onChange={(e) => setNewInstance({ ...newInstance, department: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Image ID</Form.Label>
              <div className="d-flex align-items-center">
                {loadingAmis ? (
                  <Spinner animation="border" size="sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                ) : (
                  <Form.Select
                    value={newInstance.imageid}
                    onChange={(e) => setNewInstance({ ...newInstance, imageid: e.target.value })}
                  >
                    <option value="">Select an AMI</option>
                    {amis.map((ami) => (
                      <option key={ami.image_id} value={ami.image_id}>
                        {ami.name} ({ami.image_id})
                      </option>
                    ))}
                  </Form.Select>
                )}
                <Button variant="light" onClick={fetchAmis} disabled={loadingAmis} className="ms-2">
                  <ArrowRepeat size={20} />
                </Button>
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Spot Instance"
                checked={newInstance.is_spot}
                onChange={(e) => setNewInstance({ ...newInstance, is_spot: e.target.checked })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreateInstance} disabled={loading || !newInstance.imageid}>
            {loading ? (
              <Spinner animation="border" size="sm" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            ) : (
              'Create'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Instance Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton className="modal-header">
          <Modal.Title>Edit Instance: {selectedInstance?.instance_id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedInstance && (
            <div>
              <p><strong>Name:</strong> {selectedInstance.name}</p>
              <p><strong>State:</strong> {selectedInstance.power_state}</p>
              <p><strong>Public IP:</strong> {selectedInstance.public_ip}</p>
              <p><strong>Private IP:</strong> {selectedInstance.ip}</p>
              {actionLoading ? (
                <div className="text-center">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                  <p>Processing your request...</p>
                </div>
              ) : (
                <>
                  {selectedInstance.power_state !== 'terminated' && (
                    <ToggleButtonGroup
                      type="radio"
                      name="instance-actions"
                      defaultValue={selectedInstance.power_state}
                      className="mb-3"
                    >
                      <ToggleButton
                        id={`start-${selectedInstance.instance_id}`}
                        value="running"
                        variant="outline-success"
                        onClick={() => handleInstanceAction('start', selectedInstance.instance_id)}
                        disabled={selectedInstance.power_state === 'running' || actionLoading}
                      >
                        <Play size={16} className="me-2" />
                        Start
                      </ToggleButton>
                      <ToggleButton
                        id={`stop-${selectedInstance.instance_id}`}
                        value="stopped"
                        variant="outline-danger"
                        onClick={() => handleInstanceAction('stop', selectedInstance.instance_id)}
                        disabled={selectedInstance.power_state === 'stopped' || actionLoading}
                      >
                        <Stop size={16} className="me-2" />
                        Stop
                      </ToggleButton>
                    </ToggleButtonGroup>
                  )}
                  <Button
                    variant="danger"
                    onClick={() => {
                      setInstanceToTerminate(selectedInstance.instance_id);
                      setShowConfirmTerminateModal(true);
                    }}
                    className="w-100"
                    disabled={selectedInstance.power_state === 'terminated' || actionLoading}
                  >
                    <Trash size={16} className="me-2" />
                    Terminate
                  </Button>
                </>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Confirm Terminate Modal */}
      <Modal show={showConfirmTerminateModal} onHide={() => setShowConfirmTerminateModal(false)}>
        <Modal.Header closeButton className="modal-header">
          <Modal.Title>Confirm Termination</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to terminate this instance?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmTerminateModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmTerminate} disabled={actionLoading}>
            {actionLoading ? (
              <Spinner animation="border" size="sm" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            ) : (
              'Terminate'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Toast Notification */}
      <Toast
        onClose={() => setShowToast(false)}
        show={showToast}
        delay={3000}
        autohide
        className="toast-custom"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
        }}
      >
        <Toast.Header className="toast-header-custom">
          <strong className="me-auto">Notification</strong>
        </Toast.Header>
        <Toast.Body>{toastMessage}</Toast.Body>
      </Toast>

      {/* Toast Notification for Action Errors */}
      <Toast
        onClose={() => setShowActionErrorToast(false)}
        show={showActionErrorToast}
        delay={3000}
        autohide
        className="toast-custom"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
        }}
      >
        <Toast.Header className="toast-header-custom bg-danger text-white">
          <strong className="me-auto">Error</strong>
        </Toast.Header>
        <Toast.Body>{actionError}</Toast.Body>
      </Toast>
    </Container>
  );
};

export default App;