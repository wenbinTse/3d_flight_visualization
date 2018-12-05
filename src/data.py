import json

airlines_file = './data/airlines.json'
airports_file = './data/airports.json'
combined_file = './data/airlines_complete.json'

def combine():
  content_line = open(airlines_file)
  content_port = open(airports_file)
  json_arlines, json_airports = json.load(content_line), json.load(content_port)

  position_airports = {}
  for x in json_airports:
    position_airports[x['iata']] = x['coordinates']
    
  data = []
  for x in json_arlines:
    origin, destin, num = x['direction']['origin'], x['direction']['destination'], x['num']
    if origin in position_airports and destin in position_airports:
      data.append({
        'start': position_airports[origin],
        'end': position_airports[destin],
        'properties': {
          'size': num,
          'startCity': origin,
          'endCity': destin
        }
      })

  print('size ', len(data))
  
  data.sort(key=lambda x: x['properties']['size'], reverse=True)
  
  with open(combined_file, 'w') as f:
    json.dump(data, f, indent=4)
    print('saved to {}'.format(combined_file))
  

combine()
