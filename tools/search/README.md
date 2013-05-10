gae-bulkloader
==============

Google App Engine bulkloader for Python.

# Dev server

To bulkload locally to dev server, bulkload some data in the /test directory for the following `--kind` models: Record, RecordIndex, Organization, Resource.

Example for RecordIndex

```bash
echo 'XX' | appcfg.py upload_data --log_file=bulk.log --batch_size=10 --num_threads=10 --config_file=bulkload.yaml --filename=test/ttrs_mammals.csv.aa  --url=http://localhost:8080/_ah/remote_api --email=foo@fooey.com --passin --application=dev~vn-app --kind RecordIndex
```