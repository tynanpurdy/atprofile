#!/usr/bin/env bash

pnpm exec lex-cli generate \
    /home/natalie/code/atptools/lexicons/src/**/*.json \
    -o /home/natalie/code/atptools/src/lib/lexicons.ts \
    --description "Lexicons used internally in atp.tools"
