# EC2 Instance Dashboard

A full-stack web application for managing AWS EC2 instances using a modern tech stack:  
- **Frontend**: React.js  
- **Backend**: Python FastAPI  
- **AWS SDK**: Boto3  

## 📚 Table of Contents  
- [Project Overview](#-project-overview)  
- [Features](#-features)  
- [Installation](#-installation)  
  - [Prerequisites](#prerequisites)  
  - [Backend Setup](#backend-setup)  
  - [Frontend Setup](#frontend-setup)  
  - [Run the Application](#run-the-application)  

---

## 🚀 Project Overview  

**EC2 Instance Dashboard** is a web-based tool designed to simplify the management of Amazon EC2 instances. With an intuitive user interface and seamless backend integration, users can:  
- View detailed information about their EC2 instances (ID, state, type, etc.).  
- Start, stop, and terminate instances with a single click.  
- Create new instances directly from the dashboard.   

---

## 📸 Features  

- **Instance Management**: Start, stop, and terminate EC2 instances effortlessly.  
- **Instance Listing**: View all EC2 instances with detailed information (ID, state, type, etc.).  
- **Real-Time Updates**: Get instant feedback on instance status changes.  
- **Instance Creation**: Easily create new EC2 instances from the dashboard.  

---

## ⚙️ Installation  

### Prerequisites  
Before getting started, ensure you have the following installed and configured:  
- **Node.js** (v16 or higher) and **npm/yarn** for the frontend.  
- **Python** (3.8 or higher) for the backend.  
- **AWS CLI** configured with valid credentials.  
- **Virtualenv** (optional but recommended for Python environment management).  

---

### Backend Setup  

1. **Configure AWS Credentials**: 

    Ensure your AWS CLI is configured with the necessary credentials:  
   ```bash
   aws configure
    ```
2. **Set Up Python Environment**:
    
    Navigate to the backend directory and create a virtual environment:
    ```bash
    cd api
    python -m venv venv
    source venv/bin/activate  
    ```
3. **Install Dependencies**:
    
    Install the required Python packages:
    ```bash
    pip install -r requirements.txt
    ```
4. **Run the Backend Server**:

    Start the FastAPI server:
    ```bash 
    uvicorn instances:app --reload
    ```
## Frontend Setup
1. **Install Dependencies**:
    Navigate to the frontend directory and install the required packages:
    ```bash 
    cd ./aws-instance-manager
    npm install
    ```

2. **Start the React Application**:
    Launch the frontend development server:
    ```bash
        npm run start
    ```
## Run the Application
To start the application, use the provided scripts:

1. **Start the Full Application**:
    ```bash
    chmod +x start_app.sh
    bash start_app.sh
    ```
2. **Start the Backend Service**:
    ```bash
    chmod +x start_service.sh
    bash start_service.sh
    ```
