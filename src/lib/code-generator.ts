export type Language = 'curl' | 'javascript' | 'python' | 'php' | 'ruby';

export interface CodeExample {
  language: Language;
  label: string;
  code: string;
}

export function generateCodeExamples(endpoint: string, apiKey: string = 'YOUR_API_KEY_HERE'): CodeExample[] {
  const baseUrl = 'https://sqtkkzdswxazyikcheds.supabase.co/functions/v1';
  
  const examples: Record<Language, CodeExample> = {
    curl: {
      language: 'curl',
      label: 'cURL',
      code: `curl -X GET \\
  '${baseUrl}/${endpoint}' \\
  -H 'X-API-Key: ${apiKey}' \\
  -H 'Content-Type: application/json'`
    },
    javascript: {
      language: 'javascript',
      label: 'JavaScript',
      code: `// Using fetch API
const response = await fetch('${baseUrl}/${endpoint}', {
  method: 'GET',
  headers: {
    'X-API-Key': '${apiKey}',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);`
    },
    python: {
      language: 'python',
      label: 'Python',
      code: `import requests

url = '${baseUrl}/${endpoint}'
headers = {
    'X-API-Key': '${apiKey}',
    'Content-Type': 'application/json'
}

response = requests.get(url, headers=headers)
data = response.json()
print(data)`
    },
    php: {
      language: 'php',
      label: 'PHP',
      code: `<?php
$url = '${baseUrl}/${endpoint}';
$headers = [
    'X-API-Key: ${apiKey}',
    'Content-Type: application/json'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$data = json_decode($response, true);
curl_close($ch);

print_r($data);
?>`
    },
    ruby: {
      language: 'ruby',
      label: 'Ruby',
      code: `require 'net/http'
require 'json'

uri = URI('${baseUrl}/${endpoint}')
request = Net::HTTP::Get.new(uri)
request['X-API-Key'] = '${apiKey}'
request['Content-Type'] = 'application/json'

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

data = JSON.parse(response.body)
puts data`
    }
  };

  return Object.values(examples);
}
