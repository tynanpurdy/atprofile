#!/usr/bin/env bash

pnpm exec lex-cli generate \
    ./lexicons/src/**/*.json \
    -o ./src/lib/lexicons.ts \
    --description "Lexicons used internally in atp.tools"
