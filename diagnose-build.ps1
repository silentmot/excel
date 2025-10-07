#!/usr/bin/env pwsh
# Build error diagnosis script
Write-Host "Starting build diagnosis..." -ForegroundColor Cyan

# Run the build and capture output
Write-Host "`nRunning: bun nx run @ops/web:build" -ForegroundColor Yellow
$output = & bun nx run @ops/web:build 2>&1
$exitCode = $LASTEXITCODE

# Display output
$output | ForEach-Object { Write-Host $_ }

# Save to file
$output | Out-File -FilePath "build-errors.log" -Encoding utf8

Write-Host "`nBuild exit code: $exitCode" -ForegroundColor $(if ($exitCode -eq 0) { "Green" } else { "Red" })
Write-Host "Full output saved to: build-errors.log" -ForegroundColor Cyan

exit $exitCode
