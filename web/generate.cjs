const fs = require('fs');
const path = require('path');

// Get the folder name from command-line arguments
const args = process.argv;
const nameIndex = args.indexOf('-n');

if (nameIndex === -1 || !args[nameIndex + 1]) {
  console.error('Usage: node generate -n <nameFolder>');
  process.exit(1);
}

const nameFolder = args[nameIndex + 1];
const basePath = path.join(__dirname, 'src/Features', nameFolder);

// Define the folder structure
const folders = ['components', 'pages', 'services', 'endpoints', 'routes'];
const files = {
  components: {
        name: `${nameFolder}.components.jsx`,
        content: `export const ${capitalize(nameFolder)}Component = ()=>  {

            return <>
              <div> ${capitalize(nameFolder)}Component </div>
            </>

        }`
    },
    pages: {
    name: `${nameFolder}.pages.jsx`,
    content: ` const ${capitalize(nameFolder)}Page = ()=>  {

    return <>
      <div> ${capitalize(nameFolder)}Page </div>
    </>
}
    export default ${capitalize(nameFolder)}Page`
  },
  services: {
    name: `${nameFolder}.services.jsx`,
      content: `import axios from "axios";
import { ${nameFolder}Endpoints } from "../${nameFolder}.endpoints";


// All POST request---------------------------------------------------- 
export const ${nameFolder}Post = async (action, payload) => {
    try {
        let response;

        switch (action) {
            case 'SEND':
                response = await axios.post(${nameFolder}Endpoints.SEND, payload);
                break;
            default:
                break;
        }

        return {
            status: true,
            data: response.data,
        };

    } catch (error) {
        if (error.response.status == 500) {
            return {
                status: false,
                message: 'Something went wrong, Please try again'
            };
        } else {
            return {
                status: false,
                message: error.response.data.message
            };
        }
    }
}

// All GET request---------------------------------------------------- 
export const ${nameFolder}Get = async (action, payload) => {
    try {
        let response;

        switch (action) {
            case 'FIND':
                response = await axios.get(${nameFolder}Endpoints.FIND, payload);
                break;
        }

        return {
            status: true,
            data: response.data,
        };

    } catch (error) {
        if (error.response.status == 500) {
            return {
                status: false,
                message: 'Something went wrong, Please try again'
            };
        } else {
            return {
                status: false,
                message: error.response.data.message
            };
        }
    }
}

    // All PATCH request---------------------------------------------------- 
export const ${nameFolder}Patch = async (action, payload) => {
    try {
        let response;

        switch (action) {
            case 'UPDATE':
                response = await axios.get(${nameFolder}Endpoints.UPDATE, payload);
                break;
        }
        return {
            status: true,
            data: response.data,
        };
    } catch (error) {
        if (error.response.status == 500) {
            return {
                status: false,
                message: 'Something went wrong, Please try again'
            };
        } else {
            return {
                status: false,
                message: error.response.data.message
            };
        }
    }
}
`
  },
  endpoints: {
    name: `${nameFolder}.endpoints.jsx`,
      content: `import { BASEURL } from "../../constants/api.constant"
      
      export const ${nameFolder}Endpoints = {
          FIND: \`\${BASEURL}/${nameFolder}/find\`,
          UPDATE: \`\${BASEURL}/${nameFolder}/update\`,
          SEND: \`\${BASEURL}/${nameFolder}/send\`,
      }
      `
  },
  routes: {
    name: `${nameFolder}.routes.jsx`,
      content: `import { Route, Routes } from 'react-router-dom'
import ${capitalize(nameFolder)}Page from '../pages/${nameFolder}.pages'

const ${capitalize(nameFolder)}Routes = () => {

  return (
      <Routes>
          <Route path='${nameFolder}'>
              <Route path='' element={<${capitalize(nameFolder)}Page />} />
          </Route>
         
      </Routes>
  )
}

export default ${capitalize(nameFolder)}Routes`
  }
};

// Function to capitalize first letter of a string
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Function to generate the feature module
function generateFeatureModule() {
  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
    console.log(`📂 Created: Features/${nameFolder}`);
  }

  folders.forEach(folder => {
    const folderPath = path.join(basePath, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
      console.log(`📂 Created: ${folder}`);
    }

    // Create the corresponding file inside the folder with content
    const filePath = path.join(folderPath, files[folder].name);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, files[folder].content);
      console.log(`📝 Created: ${files[folder].name}`);
    }
  });

  console.log(`✅ Feature module '${nameFolder}' generated successfully!`);
}

// Run the script
generateFeatureModule();
