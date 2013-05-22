#! /bin/bash

# We've found that an m3.xlarge instance with a 50gb attached EBS volume is 
# the right balance of RAM and CPU horsepower for bulkloading. If you have 
# the ec2 command line tools installed and properly configured, you can 
# launch an instance with this one-liner (insert your own <access-id> and 
# <secret-key>:

# ec2-run-instances ami-d0f89fb9 -n 1 -b "/dev/sdb=:50" -k vertnet -K ~/.ssh/vertnet.pem --instance-type m3.xlarge -O <access-id> -W <secret-key>

##########
# config #
##########

# install a few things
sudo apt-get update
sudo apt-get install -y unzip git s3cmd sqlite3

# get vertnet webapp project - woah, bash recursion!
git clone git://github.com/VertNet/webapp.git

# install gae sdk
mkdir ~/bin
cd bin
wget http://googleappengine.googlecode.com/files/google_appengine_1.8.0.zip
unzip google_appengine_1.8.0.zip
cd ~/

# set paths
echo "export PATH=$PATH:~/bin" >> ~/.bashrc
echo "export PATH=$PATH:~/bin/google_appengine" >> ~/.bashrc

# Attach an EBS volume from AWS console
# Double-check the location of the EBS volume
# These instructions assume it is at /dev/xvdb
sudo mkfs -t ext3 /dev/xvdb
sudo mkdir /mnt/beast
sudo mount /dev/xvdb /mnt/beast
sudo chown ubuntu:ubuntu /mnt/beast

# configure app engine credentials

echo "Please enter your App Engine email address: "
read EMAIL
echo "export EMAIL=$EMAIL" >> ~/.bashrc

echo "Please enter your App Engine password: "
read GAE_PASSWORD
echo "export GAE_PASSWORD=$GAE_PASSWORD"

echo "Configuring s3cmd. Please have your AWS credentials handy and press 'enter' to continue."
read na
s3cmd --configure

source ~/.bashrc

echo "Everything is configured. You can now run bulkload.sh"
