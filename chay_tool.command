#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR/app"
if [ ! -d "node_modules" ]; then
    echo "Đang cài đặt thư viện lần đầu..."
    npm install
fi
echo "Đang khởi động TOOL PIM SANG CMS (Bản GitHub mới nhất)..."
npm run dev -- --open
