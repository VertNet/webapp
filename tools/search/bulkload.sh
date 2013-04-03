#! /bin/bash

# before doing anything, add AWS_ID and AWS_SECRET to .bashrc
# then add $GAE_PASSWORD and $EMAIL
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

# STEP 1
# configure s3cmd - have the aws id and secret handy:
# s3cmd --configure

# STEP 2
# sync harvested data to instance - run this from a screen instance:
# screen -m
# mkdir /tmp/harvest
# s3cmd sync s3://vertnet/data/staging/ /tmp/harvest

# STEP 3
# cat all part files into one big one:
# ls -R /tmp/harvest/*/part* | xargs cat > /tmp/parts

# STEP 4
# deploy to app engine - this doesn't usually need to happen
# YOU PROBABLY DON'T NEED TO DO THIS STEP:
# appcfg.py update -V bulkloader .

# STEP 5
# upload data to app engine - run this within a screen instance:
# screen -m
# echo "$GAE_PASSWORD" | appcfg.py upload_data --log_file=bulk.log --rps_limit 2000 --bandwidth_limit 2000000 --batch_size=100 --num_threads=40 --config_file=bulkload.yaml --filename=/tmp/parts --kind Record --url=http://bulkloader.vn-app.appspot.com/_ah/remote_api --email $EMAIL --passin

# MONITORING
# to check the progress of the upload, open the sql3 file that is created in
# the search directory (this one). it'll look something like 
# bulkloader-progress-20130402.230158.sql3
# run this to get the number of records already uploaded:
# sqlite> select max(key_end) from progress;
# 31010
