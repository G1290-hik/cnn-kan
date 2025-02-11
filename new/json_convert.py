import json

# Read the .txt file content
with open('new//names.txt', 'r') as f:
    lines = f.readlines()

# Process the content into a dictionary
data = {}
for line in lines:
    # Skip lines that don't match the expected format
    if ": " not in line:
        continue
    
    index, label = line.strip().split(": ", 1)
    try:
        data[int(index.strip('{}'))] = label.strip("'")
    except ValueError:
        print(f"Skipping invalid line: {line}")

# Save as JSON
with open('output.json', 'w') as json_file:
    json.dump(data, json_file, indent=4)

print("Conversion to JSON completed successfully.")
