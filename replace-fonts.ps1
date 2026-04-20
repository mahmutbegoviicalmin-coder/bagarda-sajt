$files = Get-ChildItem -Path "." -Recurse -Include "*.html","*.js" | Where-Object { $_.FullName -notlike "*node_modules*" }
foreach ($f in $files) {
  $c = Get-Content -Path $f.FullName -Raw -Encoding UTF8

  # Google Fonts: Cormorant+Garamond + Syne combo (index.html, generate.js)
  $c = $c -replace "family=Cormorant\+Garamond:wght@300;400;500;600;700&family=Syne:wght@500;600;700;800&family=DM\+Sans:wght@300;400;500", "family=Raleway:wght@300;400;500;600;700;800&family=DM+Sans:wght@300;400;500"

  # Google Fonts: Syne alone + DM Sans (tommy-polo.html and generated pages)
  $c = $c -replace "family=DM\+Sans:wght@300;400;500;600&family=Syne:wght@500;600;700&display=swap", "family=Raleway:wght@300;400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap"

  # font-family replacements (single quotes, inline styles)
  $c = $c -replace "font-family:'Syne'", "font-family:'Raleway'"
  $c = $c -replace "font-family: 'Syne'", "font-family: 'Raleway'"
  $c = $c -replace "font-family:'Cormorant Garamond'", "font-family:'Raleway'"
  $c = $c -replace "font-family: 'Cormorant Garamond'", "font-family: 'Raleway'"
  $c = $c -replace 'font-family:"Syne"', 'font-family:"Raleway"'
  $c = $c -replace "Syne,sans-serif", "Raleway,sans-serif"
  $c = $c -replace "'Syne', sans-serif", "'Raleway', sans-serif"
  $c = $c -replace "'Syne',sans-serif", "'Raleway',sans-serif"
  $c = $c -replace "'Cormorant Garamond',serif", "'Raleway',sans-serif"
  $c = $c -replace "'Cormorant Garamond', serif", "'Raleway', sans-serif"

  Set-Content -Path $f.FullName -Value $c -Encoding UTF8 -NoNewline
  Write-Host "Done: $($f.Name)"
}
Write-Host "All fonts replaced."
