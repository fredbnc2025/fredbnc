import json

# Read countries
with open('/tmp/all_countries.json') as f:
    countries = json.load(f)

europe_countries = [c for c in countries if c['continent'] == 'Europa']
print(f"Europe countries: {len(europe_countries)}")

# Let's verify Albania
al = next(c for c in europe_countries if c['id'] == 'al')
print("Albania ES:", al)
