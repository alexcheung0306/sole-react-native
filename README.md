## This is react native for sole ##

## Command ##

npx rn-new@latest


## Installation ##

Clone

Run commands:
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json

# Install all required dependencies
npm install

# Install TypeScript essentials
npm install --save-dev typescript @types/react @types/react-native

# Install Expo
npm install expo

# Install NativeWind dependencies
npm install nativewind
npm install --save-dev tailwindcss


# Git flow
 1. Create and switch to new branch
git switch -c feature/profile-page

 2. Make changes to your code
 Edit files, add new features, etc.

 3. Stage your changes
git add .

 4. Commit your changes
git commit -m "Add profile page grid layout"

 5. Push the new branch to remote repository
git push -u origin feature/profile-page

 6. Later, switch back to main branch
git switch main

 7. Merge your feature branch (when ready)
git merge feature/profile-page

# git commands
 List all branches
git branch

 List all remote branches
git branch -r

 List all branches (local and remote)
git branch -a

 Switch to existing branch
git switch branch-name

 Delete local branch
git branch -d branch-name

 Delete remote branch
git push origin --delete branch-name

# Info