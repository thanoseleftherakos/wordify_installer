#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs-extra');
const inquirer = require('inquirer');
const opn = require('opn');

const wordpress_folder = './wordpress';
const printStatus = (msg, error = false) => {
  console.log(msg);
}

if (!fs.existsSync(wordpress_folder)){
  fs.mkdirSync(wordpress_folder);
}

function required(value) {
  if(!value) {
    return false;
  }
  return true;
}

const questions = [
  {
    type: 'input',
    name: 'theme_name',
    default: 'Wordify',
    message: "Theme name:",
    validate: required
  },
  {
    type: 'input',
    name: 'site_title',
    message: "Site title:",
    validate: required
  },
  {
    type: 'input',
    name: 'site_url',
    message: "Site url:",
    validate: required
  },
  {
    type: 'input',
    name: 'admin_username',
    default: 'bracket',
    message: "Admin username:",
    validate: required
  },
  {
    type: 'input',
    name: 'admin_email',
    default: 'hello@bracket.gr',
    message: "Admin email:",
    validate: required
  },
  {
    type: 'input',
    name: 'admin_password',
    message: "Admin password:",
    validate: required
  },
  {
    type: 'input',
    name: 'db_name',
    message: "Database name:",
    validate: required
  },
  {
    type: 'input',
    name: 'db_user',
    default: 'root',
    message: "Databse user:",
    validate: required
  },
  {
    type: 'input',
    name: 'db_password',
    message: "Databse password:",
  }
]


const usersettings = async () => {
  return new Promise((resolve, reject) => {
    inquirer
    .prompt(questions)
    .then(answers => {
      resolve(answers)
    })
    .catch(error => {
      if(error.isTtyError) {
          reject(error)
      } else {
        reject('something wen wrong')
      }
    });
  });
}

const downloadWordpress = async () => {
  return new Promise((resolve, reject) => {
    exec('wp core download', { cwd: wordpress_folder}, (error, stdout, stderr) => { 
      resolve(stdout? stdout : stderr);
    });
  });
}
const createWpConfig = async (answers) => {
  return new Promise((resolve, reject) => {
    exec(`wp config create --dbname=${answers.db_name} --dbuser=${answers.db_user} --dbpass=${answers.db_password}`, { cwd: wordpress_folder}, (error, stdout, stderr) => { 
      resolve(stdout? stdout : stderr);
    });
  });
}
const createDB = async () => {
  return new Promise((resolve, reject) => {
    exec(`wp db create`, { cwd: wordpress_folder}, (error, stdout, stderr) => { 
      resolve(stdout? stdout : stderr);
    });
  });
}
const installWordpress = async (answers) => {
  return new Promise((resolve, reject) => {
    exec(`wp core install --url=${answers.site_url} --title=${answers.site_title} --admin_user=${answers.admin_username} --admin_password=${answers.admin_password} --admin_email=${answers.admin_email}`, { cwd: wordpress_folder}, (error, stdout, stderr) => { 
      resolve(stdout? stdout : stderr);
    });
  });
}
const downloadWordify = async () => {
  return new Promise((resolve, reject) => {
    exec(`wget https://github.com/thanoseleftherakos/wordify/archive/master.zip -O wordify.zip`, (error, stdout, stderr) => { 
      resolve(stdout? stdout : stderr);
    });
  });
}
const installWordify = async () => {
  return new Promise((resolve, reject) => {
    exec('wp theme install wordify.zip', { cwd: wordpress_folder+'/wp-content/themes'}, (error, stdout, stderr) => { 
      resolve(stdout? stdout : stderr);
    });
  });
}

const valetLink = async (answers) => {
  return new Promise((resolve, reject) => {
    exec(`valet link ${answers.site_url.substring(0, answers.site_url.lastIndexOf("."))}`, { cwd: wordpress_folder}, (error, stdout, stderr) => { 
      resolve(stdout? stdout : stderr);
    });
  });
}


const sequence = async () => {
  const answers = await usersettings().catch(error => { printStatus(error, true); return; });
  printStatus('Downloading Wordpress...')
  const download_wp = await downloadWordpress().catch(error => { printStatus(error, true); return; });
  printStatus(download_wp);
  printStatus('Configuring Wordpress')
  const creating_wp_config = await createWpConfig(answers).catch(error => { printStatus(error, true); return; });
  printStatus(creating_wp_config);
  printStatus('Creating DB')
  const creating_db = await createDB(answers).catch(error => { printStatus(error, true); return; });
  printStatus(creating_db);
  printStatus('Installing Wordpress')
  const install = await installWordpress(answers).catch(error => { printStatus(error, true); return; });
  printStatus(install);
  const download_wordify = await downloadWordify().catch(error => { printStatus(error, true); return; });
  printStatus(download_wordify);
  await fs.move('./wordify.zip', './wordpress/wp-content/themes/wordify.zip').catch(error => { printStatus(error, true); return; });
  const install_wordify = await installWordify().catch(error => { printStatus(error, true); return; });
  printStatus(install_wordify);
  const valet_link = await valetLink(answers).catch(error => { printStatus(error, true); return; });
  printStatus(valet_link);
  printStatus('Finished!');
  const start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
  opn('http://'+answers.site_url);
}

sequence();



