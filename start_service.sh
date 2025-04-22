#!/bin/sh
cd ./api
pip3 install -r ./requirements.txt
python3 -m uvicorn instances:app --reload