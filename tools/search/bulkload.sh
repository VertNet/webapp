#! /bin/bash

# before doing anything, add AWS_ID and AWS_SECRET to .bashrc
# then add $GAE_PASSWORD and $EMAIL:
# export EMAIL="your@email.com"
# export GAE_PASSWORD="yourpassword"
# then you can run this setup script, and follow up with the manual steps at the end

##########
# config #
##########

# install a few things
sudo apt-get update
sudo apt-get install -y unzip git s3cmd sqlite3

# get vertnet webapp project
git clone git://github.com/VertNet/webapp.git

# install gae sdk
mkdir ~/bin
cd bin
wget http://googleappengine.googlecode.com/files/google_appengine_1.7.5.zip
unzip google_appengine_1.7.5.zip
cd ~/

# set paths
echo "export PATH=$PATH:~/bin" >> ~/.bashrc
echo "export PATH=$PATH:~/bin/google_appengine" >> ~/.bashrc
source ~/.bashrc

#################
# MANUAL STEPS #
#################

# STEP 0
# Attach an EBS volume from AWS console
# sudo mkfs -t ext3 /dev/xvdf
# sudo mkdir /mnt/beast
# sudo mount /dev/xvdf /mnt/beast
# sudo chown ubuntu:ubuntu /mnt/beast

# STEP 1
# configure s3cmd - have the aws id and secret handy:
# s3cmd --configure

# STEP 2
# sync harvested data to instance - run this from a screen instance:
# screen -m
# mkdir /mnt/beast/harvest
# s3cmd sync s3://vnproject/data/staging/ /mnt/beast/harvest

# STEP 3
# cat all part files into one big one:
# ls -R /mnt/beast/harvest/*/part* | xargs cat > /mnt/beast/parts

# STEP 4
# deploy to app engine - this doesn't usually need to happen
# YOU PROBABLY DON'T NEED TO DO THIS STEP:
# appcfg.py update -V bulkloader .

# STEP 5
# upload data to app engine - run this within a screen instance, from the
# 'webapp/tools/search/' directory:
# screen -m
# echo "$GAE_PASSWORD" | appcfg.py upload_data --log_file=bulk.log --rps_limit 2000 --bandwidth_limit 2000000 --batch_size=100 --num_threads=40 --config_file=bulkload.yaml --filename=/mnt/beast/parts --kind Record --url=http://bulkloader.vn-app.appspot.com/_ah/remote_api --email $EMAIL --passin

# STEP 6
# Bulkload index
# You need a header in the file:
# cat header.tsv > /mnt/beast/parts
# echo >> /mnt/beast/parts
# ls -R /mnt/beast/harvest/*/part* | xargs cat > /mnt/beast/parts

# echo "$GAE_PASSWORD" | appcfg.py upload_data --log_file=bulk.log --rps_limit 2000 --bandwidth_limit 2000000 --batch_size=100 --num_threads=40 --config_file=bulkload.yaml --filename=/mnt/beast/parts --kind RecordIndex --url=http://bulkloader.vn-app.appspot.com/_ah/remote_api --email $EMAIL --passin

# MONITORING
# to check the progress of the upload, open the sql3 file that is created in
# the search directory (this one). it'll look something like 
# bulkloader-progress-20130402.230158.sql3
# run this to get the number of records already uploaded (replacing the .sql3 filename with the one you have):
# sqlite3 bulkloader-progress-20130402.230158.sql3
# sqlite> select max(key_end) from progress;
# 31010
