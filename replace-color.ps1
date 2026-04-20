$files = Get-ChildItem -Path "." -Recurse -Include "*.html","*.js" | Where-Object { $_.FullName -notlike "*node_modules*" }
foreach ($f in $files) {
  $c = Get-Content -Path $f.FullName -Raw -Encoding UTF8
  $c2 = $c -replace "#C9A96E", "#6B21A8"
  if ($c2 -ne $c) {
    Set-Content -Path $f.FullName -Value $c2 -Encoding UTF8 -NoNewline
    Write-Host "Updated: $($f.Name)"
  }
}
Write-Host "Done."
