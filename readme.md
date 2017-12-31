# Hacked usb toy turret, controlled with a raspberry pi and node.js

**It controls a usb toy turret. Way to hack:**

* removing the "main board" from the turret
* removing other screws to disassemble the turret
* identifying the wires for the motors and the end buttons
* you can ignore the wire that goes to the motor metal body, cut'em
* then you have two motors and for every motor two end buttons
* that makes 8 wires
* i use a flat phone cable with 4 wires for a motor an his two stoppers
* solder one end directly
* solder the end buttons to female pin
* connect the females on the gpios
* connect the open end to the motor driver
* connect the motor driver with the gpios

**The installation copies all the needed config files in the right place:**

* installs node.js correctly with a new global npm folder, correct `PATH` environment and user rights 
* npm installs `n` globally to toggle easy between different node versions
* using node version `6.11.0` - but you can try: `n latest` after the installation
* pi users `.bashrc` file
* german default `keyboard` scheme
* `sudoers` file with the pi user as sudo and extended secure path pointed to the npm global folder for all users (sudo, pi)

# Setting up the pi itself (first boot)

* download a Jessie image
* write it on sd
* start the first time in pixel deskop
* change:
    * boot to cli
    * password
    * disable auto-login
    * hostname
    * activate ssh
    * language settings, keyboard, wifi
* reboot into the command line
* login in with given password as user `pi`

# Continue in the console

* Installing all stuff
 
      sudo mkdir /data
      cd /data
      sudo git clone https://github.com/seekwhencer/pirett-node.git app
      cd app
      sudo sh /data/app/script/install.sh
      
* After the installation should be a reboot useful.
Hit ***`` CTRL + Alt + Del ``*** ... on the pi - or enter:

      sudo shutdown now

### After Reboot
   
* Rename the config files (first time)
   
      cp /data/app/config/*.js.default cp /data/app/config/*.js
  
### Run it

    cd /data/app
    npm start

# Hardware

* Raspberry Pi 3
* L289n Motor Driver
* 5V 3A Power Supply
* USB Turret

### Update the app

      cd /data/app
      git pull origin
      
 