'''
change country_code.csv to json
'''

import json
from json import encoder

csv_file = '../data/country_code.csv'
json_file = '../data/country_code.json'

def change():
  lines = open(csv_file, 'r').readlines()
  splited = [l.split(',') for l in lines]
  data = {}
  for arr in splited:
    data[arr[2]] = {
      'name': arr[0],
      'englishName': arr[1],
      'code3': arr[3],
      'code2': arr[2]
    }

  with open(json_file, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=4, ensure_ascii=False)
    print('Saved to ', json_file)

if __name__ == '__main__':
  change()
