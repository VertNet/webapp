import re

def tokens(lines):
	s = set()
	for line in lines:
		tokens = line.split()
		for x in tokens:
			x = x.replace('(', '')
			x = x.replace(')', '')
			x = x.replace('"', '')
			x = x.replace(',', '')
			x = x.replace(';', '')
			x = x.replace('.', '')
			ret = re.sub('([a-zA-Z])(uml|acute|grave|circ|tilde|cedil)', r'\1', x)
			ret = ret.strip()
			ret = re.sub(' ', '_', ret)
			ret = re.sub('\W', '', ret)
			if x.strip():
				s.add(x.lower().strip())
	return s

def tocsv(uniques):
	uniques = [x for x in uniques if x]
	uniques.sort()
	f = open('unique_tissue_prep_tokens.csv', 'w')
	for x in uniques:
		f.write('%s\n' % x)

tissues = open('/home/eightysteele/Desktop/tissues.csv', 'r').read().splitlines()
preps = open('/home/eightysteele/Desktop/preps.csv', 'r').read().splitlines()
tt = tokens(tissues)
print '%s tissues' % len(tt)
pt = tokens(preps)
print '%s preps' % len(pt)
results = set()
results.update(tt)
results.update(pt)
tocsv(results)