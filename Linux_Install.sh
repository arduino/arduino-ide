#!/bin/sh

############################################################################
##  Linux install script for Arduino IDE 2.0 - contributed by Art Sayler  ##
##  https://github.com/arduinoshop                                        ##
##
##	version 1.00
############################################################################

MODE=U
YN=n
RESOURCE_NAME=arduino-arduinoide2
RED='\033[0;31m'
NOCOLOR='\033[0m'
VERSION="1.00"

echo "\nLinux_Install.sh ver. $VERSION for the Arduino IDE 2.0\n"

if [ -z $1 ]
then
	echo no option selected - defaulting to single user instalation
	echo "usage: ./Linux_Install.sh [local] | [ulocal]"
	echo "        local   - installs IDE for user $USER only ( default if no option given )"
	echo "        ulocal  - uninstall IDE from user $USER"
	echo "usage: sudo ./Linux_Install.sh [system] | [usystem]"	
	echo "        system  - install IDE systemwide for all users"
	echo "        usystem - uninstall IDE systemwide from all users\n"
	echo "Both local and system installations may be used on the same computer"
	echo "for example - a stable release installed systemwide and a nightly for a development user\n"

	MSG="Install IDE 2.0 for user $USER only?"

elif [ $1 = local ]
then
		MSG="Install IDE 2.0 for user $USER only?"
elif [ $1 = ulocal ]
then
		MSG="UnInstall IDE 2.0 from user $USER?"
		MODE=u
elif [ $1 = usystem ]
then
		MSG="UnInstall IDE 2.0 system wide (all users will be affected)?"
		MODE=s
elif [ $1 = system ]
then
		MSG="Install IDE 2.0 system wide (all users will have access)?"
		MODE=S
fi
	
# Get absolute path from which this script file was executed
# (Could be changed to "pwd -P" to resolve symlinks to their target)
SCRIPT_PATH=$( pwd -P )
LIB_PATH=$SCRIPT_PATH
EXE_PATH=$SCRIPT_PATH
# echo S_PATH = $SCRIPT_PATH


read -p "$MSG (Y/N) " YN

if [ -z $YN ]
then
	echo OK - exiting
	exit	
elif [ $YN = n ]
then
	echo OK - No is No... exiting
	exit
fi	

echo

###### Remove local user installation
	
	if [ $MODE = u ]
	then
		echo Uninstalling IDE 2.0 from user $USER
		echo "Deleting ${HOME}/.local/share/applications/${RESOURCE_NAME}l.desktop"
		rm   ${HOME}/.local/share/applications/${RESOURCE_NAME}l.desktop
		
		echo "Deleting ${HOME}/.local/lib/${RESOURCE_NAME}"
		rm -rf ${HOME}/.local/lib/${RESOURCE_NAME}
		
		echo "Deleting ${HOME}/.local/bin/${RESOURCE_NAME}"
		rm   ${HOME}/.local/bin/${RESOURCE_NAME}				
		
		echo "Installation directory and it's contents including this script can be removed"
		read -p "Delete directory ${SCRIPT_PATH}? (YES for the affirmative)" YN
		if [ -z $YN ]
		then
			echo exiting; exit
		elif [ $YN = YES ]
		then
			echo "Removing Directory ${SCRIPT_PATH}"
			cd ..
			rm -rf ${SCRIPT_PATH}
		fi
	fi

###### Perform local user only installation	
	if [ $MODE = U ]
	then
		
		LIB_PATH=${HOME}/.local/lib/${RESOURCE_NAME}
		EXE_PATH=${HOME}/.local/bin
			
		if [ $YN = Y ] || [ $YN = y ]
		then
			mkdir -p $LIB_PATH
			echo -n "Copying files... "
			cp -rf * ${HOME}/.local/lib/${RESOURCE_NAME}
			echo "Files copied...\n"
		fi
		
		mkdir -p "${HOME}/.local/bin"
		rm -f ${HOME}/.local/bin/${RESOURCE_NAME}
		ln -s ${HOME}/.local/lib/${RESOURCE_NAME}/arduino-ide ${HOME}/.local/bin/${RESOURCE_NAME}
	
		# Create a temp dir accessible by all users
		TMP_DIR=`mktemp --directory`

		# Create *.desktop file using the existing template file
		sed -e "s,<BINARY_LOCATION>,${EXE_PATH}/${RESOURCE_NAME},g" \
	    -e "s,<id>,local,g" \
        -e "s,<ICON_NAME>,${LIB_PATH}/arduino2.png,g" "${SCRIPT_PATH}/desktop.template" > "${TMP_DIR}/${RESOURCE_NAME}l.desktop"

		mkdir -p "${HOME}/.local/share/applications"
		cp "${TMP_DIR}/${RESOURCE_NAME}l.desktop" "${HOME}/.local/share/applications/"
		echo "Installing Launcher and Icon\n"
		
		echo "Launcher and Icon Installed\n"
		echo "Go to \"Show Application\" ( button in lower left or hit \"Super/Windows Key\")"
		echo "Search for \"Arduino\" - you will see an Icon labeled \"2.0 $1\""
		echo "click on this icon to run the IDE or right-click to add it to the Dock\n"
  
# Clean up temp dir
		rm "${TMP_DIR}/${RESOURCE_NAME}l.desktop"
		rmdir "${TMP_DIR}"
	fi

######## System Wide Install / UnInstall
	if [ $MODE = s ] || [ $MODE = S ]
	then
		if [ $USER != root ]
		then
			echo "$RED You must be SuperUser to make SystemWide changes$NOCOLOR\007"
			echo "Use sudo ./Linux_Install.sh [option]\n"
			exit
		fi	
	fi

######## System Wide UnInstall
	
	if [ $MODE = s ]
	then
		echo Uninstalling IDE 2.0 systemwide
		
		if [ -f /usr/local/share/applications/${RESOURCE_NAME}.desktop ]
		then	
			echo "Deleting /usr/local/share/applications/${RESOURCE_NAME}.desktop"
			rm   /usr/local/share/applications/${RESOURCE_NAME}.desktop
		fi
		
		if [ -f /usr/local/bin/${RESOURCE_NAME} ]
		then	
			echo "Deleting /usr/local/bin/${RESOURCE_NAME}"
			rm   /usr/local/bin/${RESOURCE_NAME}
		fi	

		if [ -d /usr/local/lib/${RESOURCE_NAME} ]
		then	
			echo "Deleting Directory /usr/local/lib/${RESOURCE_NAME}"
			rm -rf /usr/local/lib/${RESOURCE_NAME}
		else
			echo "/usr/local/lib/${RESOURCE_NAME} does not exist"
		fi

		echo "Installation directory and it's contents including this script can be removed"
		read -p "Delete directory ${SCRIPT_PATH} (YES)? " YN
		if [ -z $YN ]
		then
			echo "Directory ${SCRIPT_PATH} will not be removed"
		elif [ $YN != YES ]
		then
			echo "Directory ${SCRIPT_PATH} will not be removed"
		else
			echo "Removing Directory ${SCRIPT_PATH}"
			cd ..
			rm -rf ${SCRIPT_PATH}			
		fi
	fi

###### Perform SystemWide installation	
	if [ $MODE = S ]
	then
		echo -n "Copying downloaded files to /usr/local/lib... "
		LIB_PATH=/usr/local/lib/${RESOURCE_NAME}
		EXE_PATH=/usr/local/bin
		mkdir -p $LIB_PATH	
		cp -rf * $LIB_PATH
		rm -f $EXE_PATH/${RESOURCE_NAME}
		ln -s $LIB_PATH/arduino-ide $EXE_PATH/${RESOURCE_NAME}
		echo "Files copied...\n"
	
		# Create a temp dir accessible by all users
		TMP_DIR=`mktemp --directory`

		# Create *.desktop file using the existing template file
		sed -e "s,<BINARY_LOCATION>,${EXE_PATH}/${RESOURCE_NAME},g" \
	    -e "s,<id>,system,g" \
        -e "s,<ICON_NAME>,${LIB_PATH}/arduino2.png,g" "${SCRIPT_PATH}/desktop.template" > "${TMP_DIR}/${RESOURCE_NAME}.desktop"

		mkdir -p "${HOME}/.local/share/applications"
		cp "${TMP_DIR}/${RESOURCE_NAME}.desktop" "/usr/local/share/applications/"
		echo "Launcher and Icon Installed\n"
		echo "Go to \"Show Application\" ( button in lower left or hit \"Super/Windows Key\")"
		echo "Search for \"Arduino\" - you will see an Icon labeled \"2.0 $1\""
		echo "click on this icon to run the IDE or right-click to add it to the Dock\n"
  
		# mkdir -p "${HOME}/.local/share/metainfo"
		# cp "${SCRIPT_PATH}/lib/appdata.xml" "${HOME}/.local/share/metainfo/${RESOURCE_NAME}.appdata.xml"

		# Clean up temp dir
		rm "${TMP_DIR}/${RESOURCE_NAME}.desktop"
		rmdir "${TMP_DIR}"
	fi

exit
