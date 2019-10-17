"""
把航班信息按城市聚类，保存到json文件
"""

import os
import json

os.chdir('../data')

airlines_file = 'airlines_complete.json'
airlines_dict_city_file = 'airlines_dict_clustered_by_city.json'
airlines_list_city_file = 'airlines_list_clustered_by_city.json'

with open(airlines_file, 'r', encoding='utf8') as f:
    airlines = json.load(f)

airlines_city_dict = {}

for index, airline in enumerate(airlines):
    properties = airline['properties']
    start_city = properties['startCity']
    end_city = properties['endCity']

    if start_city not in airlines_city_dict:
        airlines_city_dict[start_city] = {
            'num': 0,
            'num_in': 0,
            'end': {},
            'coordinates': airline['start'],
            'state': properties['startAirport']['state'],
            'countryEng': properties['startAirport']['countryEng'],
            'countryChi': properties['startAirport']['countryChi']
        }

    if end_city not in airlines_city_dict:
        airlines_city_dict[end_city] = {
            'num': 0,
            'num_in': 0,
            'end': {},
            'coordinates': airline['end'],
            'state': properties['endAirport']['state'],
            'countryEng': properties['endAirport']['countryEng'],
            'countryChi': properties['endAirport']['countryChi']
        }

    if end_city not in airlines_city_dict[start_city]['end']:
        airlines_city_dict[start_city]['end'][end_city] = {
            'num': 0,
            'list': [],
            'coordinates': airlines_city_dict[end_city]['coordinates'],
            'state': properties['endAirport']['state'],
            'countryEng': properties['endAirport']['countryEng'],
            'countryChi': properties['endAirport']['countryChi']
        }

    airlines_city_dict[start_city]['num'] += properties['size']
    airlines_city_dict[end_city]['num_in'] += properties['size']
    airlines_city_dict[start_city]['end'][end_city]['num'] += properties['size']
    airlines_city_dict[start_city]['end'][end_city]['list'].append({
        'startAirport': properties['startAirport']['name'],
        'endAirport': properties['endAirport']['name'],
        'num': properties['size']
    })

with open(airlines_dict_city_file, 'w', encoding='utf8') as f:
    json.dump(airlines_city_dict, f, ensure_ascii=False, indent=4)
    print('saved to {}'.format(airlines_dict_city_file))

airlines_city_list = []
for start_city in airlines_city_dict:
    for end_city in airlines_city_dict[start_city]['end']:
        start = airlines_city_dict[start_city]
        end = airlines_city_dict[start_city]['end'][end_city]
        airlines_city_list.append({
            'num': end['num'],
            'start': {
                'name': start_city,
                'coordinates': start['coordinates'],
                'state': start['state'],
                'countryEng': start['countryEng'],
                'countryChi': start['countryChi']
            },
            'end': {
                'name': end_city,
                'coordinates': end['coordinates'],
                'state': end['state'],
                'countryEng': end['countryEng'],
                'countryChi': end['countryChi']
            }
        })

airlines_city_list.sort(key=lambda x: x['num'], reverse=True)

with open(airlines_list_city_file, 'w', encoding='utf8') as f:
    json.dump(airlines_city_list, f, ensure_ascii=False, indent=4)
    print('saved to {}'.format(airlines_list_city_file))

print('城市数：{}'.format(len(airlines_city_dict)))
print('聚类前航班数: {}'.format(len(airlines)))
print('聚类后航班数: {}'.format(len(airlines_city_list)))
