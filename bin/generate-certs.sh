#!/bin/bash

mkdir -p bin/certs
openssl req -x509 -newkey rsa:2048 -keyout bin/certs/key.pem -out bin/certs/cert.pem -days 365 -nodes -subj "/CN=127.0.0.1"
