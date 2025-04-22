import React from 'react';
import { Button } from 'react-bootstrap';

const EditButton = ({ instance, onEdit }) => {
  const isTerminated = instance.power_state === 'terminated';
  return (
    <Button variant="info" size="sm" onClick={() => onEdit(instance)} disabled={isTerminated} className="btn-custom">
      Edit
    </Button>
  );
};

export default EditButton;