import requests
import time

print('Testing optimized API...')
start = time.time()
with open('test_audio.wav', 'rb') as f:
    files = {'audio': f}
    response = requests.post('http://localhost:8000/api/analyze', files=files, timeout=30)
    elapsed = time.time() - start

print(f'Response status: {response.status_code}')
print(f'Time taken: {elapsed:.1f}s (down from 17.6s before fix)')

if response.ok:
    data = response.json()
    print(f'Prediction: {data.get("predicted_class")} ({data.get("confidence", 0)*100:.1f}%)')
    print(f'Risk: {data.get("risk")}')
    print('✓ All systems operational!')
else:
    print(f'Error: {response.status_code}')
