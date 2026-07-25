#!/bin/bash
echo "Logging in..."
RES=$(curl -s -X POST http://localhost:3000/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"test2@example.com","password":"password123"}')
TOKEN=$(echo $RES | jq -r .data.accessToken)
echo "Token: $TOKEN"
echo "Fetching net worth..."
curl -s -w "\nHTTP Status: %{http_code}\n" -X GET http://localhost:3000/api/v1/ledger/net-worth -H "Authorization: Bearer $TOKEN"
