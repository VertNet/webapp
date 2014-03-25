#!/usr/bin/python
"""
Runs test_api.py for specified combinations of the App Engine parameters
"limit" and "number_found_accuracy".  This is useful for automated,
comprehensive testing of VertNet search API performance across a range
of potential parameter conditions.
"""

import subprocess

# The number of replicates to run for each "limit"/"number_found_accuracy"
# parameter values combination.
rounds = 4

# The values of the "limit" parameter to test.
limits = (400,)

# The values of the "number_found_accuracy" parameter to test.
accuracies = (100, 1000, 10000)

# The location to output the results.  Use a blank string or './' to output
# to the current working directory.
output_loc = 'api_test_results/'

# The input test queries file to use.
queries_file = 'liveVN_test_queries-mixed.csv'


for roundnum in range(rounds):
    for accuracy in accuracies:
        for limit in limits:
            # Generate the base output file name.
            foutname = (output_loc + 'results-limit_' + str(limit) + '-accuracy_' +
                    str(accuracy) + '-' + str(roundnum) + '.csv')

            # Build the shell command string.
            command = ('./test_api.py -i ' + queries_file + ' -o ' + foutname +
                    ' -l ' + str(limit) + ' -a ' + str(accuracy))

            # Print the shell command string and run test_api.py.
            print command
            subprocess.call(command, shell=True)

