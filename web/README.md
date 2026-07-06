# Awinteck React Template

### Author: [Samjay Awinteck](https://github.com/Samjay1)
### Date: 2025-02-21 08:00 PM
### Description: This ReactJS application comes with ability to generate new features in Modula format.


This template relies on:
 - [vite](https://vite.dev/guide/)
 - [tailwindcss](https://tailwindcss.com/)
 - [mantine](https://mantine.dev/)

## Instructions to setup
1. Clone the repository
2. Run `npm install` to install all dependencies
3. Run `npm run dev` to start the development server
4. Open your browser and navigate to `http://localhost:8080`
5. You can now start coding and see the changes in your browser

## Instructions to deploy
1. Run `npm run build` to build the production version of your application
2. Run `npm run start` to start the production server




## Generate new Modules

Run `node generate.cjs -n <moduleName>`

eg. `node generate.cjs -n auth`

This will create a new module with the name `auth` in the `src/features/` directory.
 
The module will have the following structure:
- components
- pages
- services
- routes
- endpoints