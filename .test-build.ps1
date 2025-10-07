# Test build script
cd f:\excel\ops
bun nx run @ops/web:build 2>&1 | Tee-Object -FilePath "build-errors.log"
