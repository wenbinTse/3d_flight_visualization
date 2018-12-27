'''
combine airlines.json and airlines.json
'''

import json
import os

airlines_file = '../data/airlines.json'
airports_file = '../data/airports.json'
combined_file = '../data/airlines_complete.json'
airports_format_file = '../data/airports_dict.json'


def combine(international=True):
  content_line = open(airlines_file, encoding='utf8')
  content_port = open(airports_file, encoding='utf-8')
  json_arlines, json_airports = json.load(content_line), json.load(content_port)

  airports_format = {}
  for x in json_airports:
    airports_format[x['icao']] = {
      'coordinates': x['coordinates'],
      'name': x['name'],
      'city': x['city'],
      'state': x['state'],
      'countryEng': x['country'][0],
      'countryChi': x['country'][1]
    }
    
  data = []
  for x in json_arlines:
    origin, destin, num = x['direction']['origin']['icao'], x['direction']['destination']['icao'], x['num']

    if origin in airports_format and destin in airports_format:
  
      if international and airports_format[origin]['countryEng'] == airports_format[destin]['countryEng']:
        continue

      if airports_format[origin]['city'] == '' or airports_format[destin]['city'] == '':
        continue

      data.append({
        'start': airports_format[origin]['coordinates'],
        'end': airports_format[destin]['coordinates'],
        'properties': {
          'size': num,
          'startAirport': airports_format[origin],
          'endAirport': airports_format[destin],
          'startCity': airports_format[origin]['city'],
          'endCity': airports_format[destin]['city']
        }
      })

  print('size ', len(data))
  
  data.sort(key=lambda x: x['properties']['size'], reverse=True)

  with open(combined_file, 'w', encoding='utf8') as f:
    json.dump(data, f, indent=4, ensure_ascii=False)
    print('saved to {}'.format(combined_file))
  
  with open(airports_format_file, 'w', encoding='utf8') as f:
    json.dump(airports_format, f, indent=4, ensure_ascii=False)
    print('saved to {}'.format(airports_format_file))
  

if __name__ == '__main__':
  combine(True)
