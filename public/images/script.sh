#!/bin/bash
# get in all svg file and create the 8 png webapp png files 
for i in *.[Ss][Vv][Gg];do

# create the favicon from a 32x32 png TODO
# inkscape -o 32.png -w 32 -h 32 $i
# convert 32.png favicon.ico
# rm 32.png

# icons with different size
mkdir -p "icons"
# cd "icons"

# inkscape -o icon16x16.png -w 16 -h 16 ../$i
# inkscape -o icon32x32.png -w 32 -h 32 ../$i
# inkscape -o icon48x48.png -w 48 -h 48 ../$i
# inkscape -o icon64x64.png -w 64 -h 64 ../$i
# inkscape -o icon72x72.png -w 72 -h 72 ../$i
# 96x96 used into console.log, 
inkscape -o icons/icon96x96.png -w 96 -h 96 $(pwd)/$i
# apple stuff
# inkscape -o icon58x58.png -w 58 -h 58 ../$i
# inkscape -o icon152x152.png -w 152 -h 152 ../$i
# inkscape -o icon167x167.png -w 167 -h 167 ../$i
# inkscape -o icon180x180.png -w 180 -h 180 ../$i

# inkscape -o icon128x128.png -w 128 -h 128 ../$i
# inkscape -o icon144x144.png -w 144 -h 144 ../$i
inkscape -o icons/icon192x192.png -w 192 -h 192 $(pwd)/$i
# inkscape -o icon256x256.png -w 256 -h 256 ../$i
# inkscape -o icon384x384.png -w 384 -h 384 ../$i
inkscape -o icons/icon512x512.png -w 512 -h 512 $(pwd)/$i
cd ..
# use the svg for big icons
# cp $i ./icons/icon.svg

done