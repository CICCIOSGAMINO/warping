#!/bin/bash

# abort on errors
set -e

npm run build

# cd dist
# if you are deploying to a custom domain
# echo 'www.example.com' > CNAME

# git init
# git remote add origin https://github.com/CICCIOSGAMINO/warping.git

# git add -A
# git commit -m 'deploy'

# git push -u origin master

# cd -

# deploy on firebase hosting too (.firebaserc for setting the project)
firebase deploy --only hosting