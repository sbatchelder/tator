#!/bin/bash

# Cleans up a ec2 instance.

# Delete ec2 instance
GIT_VERSION=$(git rev-parse HEAD)
aws ec2 delete-instance \
  --instance-id $(cat ~/ec2_instance_id.txt)
