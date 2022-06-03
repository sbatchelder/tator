#!/bin/bash

# Sets up a ec2 instance.

# Create ec2 instance
echo "Creating ec2 instance..."
GIT_VERSION=$(git rev-parse HEAD)
aws ec2 create-key-pair \
  --key-name tator-ci-$GIT_VERSION \
  --query 'KeyMaterial' \
  --output text > ~/.ssh/ec2.pem
aws ec2 run-instances \
  --image-id ami-0e9745bbc51fc59ef \
  --instance-type g4dn.2xlarge \
  --key-name tator-ci-$GIT_VERSION \
  --security-group-ids sg-037facabc1924d819 \
  > ~/ec2_info.json
cat ~/ec2_info.json \
  | jq '.PublicIpAddress' \
  > ~/ec2_public_ip_address.txt
cat ~/ec2_info.json \
  | jq '.InstanceId' \
  > ~/ec2_instance_id.txt

# Configure SSH
echo "Configuring ssh..."
cat <<EOT >> ~/.ssh/config
Host ec2
  HostName $(cat /home/$USER/ec2_public_ip_address.txt)
  User ubuntu
  Port 22
  IdentityFile /home/$USER/.ssh/ec2.pem
EOT
echo "Contents of ssh config:"
cat ~/.ssh/config
sudo chmod 600 ~/.ssh/config
sudo chmod 400 ~/.ssh/ec2.pem
echo "Testing ssh connection..."
for i in {1..5}; do ssh ec2 'echo \"Hello from ec2 instance!\"' && break || sleep 10; done
