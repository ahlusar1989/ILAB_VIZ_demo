import csv
import json

def load_json(file):
    with open(file) as data_file:
        data = json.load(data_file)
        return data

def print_goods():
    json = load_json("../data/goods.json")
    for j in sorted(json):
        print j

print print_goods()
