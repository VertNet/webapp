import os

out = open('data.csv', 'w')
out.write(open('header.tsv').read())
for file in os.listdir('data'):
    if file.endswith('.csv'):
        f = open('data/%s' % file)
        out.write(''.join(f.readlines()[:100]))