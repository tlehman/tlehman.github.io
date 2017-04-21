---
categories:
- howto
- computing
- backup
comments: true
date: 2013-12-08T00:00:00Z
title: Point Time Machine at any destination
url: /2013/12/08/point-time-machine-at-any-destination/
---

## Set up Time Machine (on Mac OS X) to back up to any network volume

Time Machine is a fine backup solution if you have a dedicated external hard drive, or if you have no problem with paying for a specialized Time Capsule.

If you have a network volume, such as an NFS, CIFS, AFP, or [πfs](https://github.com/philipl/pifs#readme) share on a file server, you need to configure a few things in order for Time Machine to use it.

I found [this article](http://lifehacker.com/5691649/an-easier-way-to-set-up-time-machine-to-back-up-to-a-networked-windows-computer) which gives step-by-step instructions, but it involves executing some shell commands. I've distilled it into three scripts: 

 - 1_enable_network_volumes.sh
 - 2_make_image.sh
 - 3_set_destination.sh
 
### Step 1

Clone [this repository](https://github.com/tlehman/time_machine_any_destination), and execute this script by cd-ing to the repository's directory, and run:

``` 
./1_enable_network_volumes.sh
```

_Explanation:_ This enables unsupported network volumes by setting `TMShowUnsupportedNetworkVolumes` to 1.

### Step 2

Next, you need to prepare a special directory on your network share, this second script will do that for you. Make sure you have your network share `/your/network/share` ready, and choose a maximum number of gigabytes, say `216`, and run:

```
./2_make_image.sh 216 /your/network/share
```

__Warning__: This script will take a while, you'll know when it's done when you `Finished! Happy backups!` in your terminal.

_Explanation_: This script creates a disk image `name.sparsebundle`, where name is your computer name, the result of the command `scutil --get ComputerName`. The sparsebundle 'file' is really a directory, and the script creates an XML plist file inside it, and then copies it to `/your/network/share/name.sparsebundle`

### Step 3

You need to mount the sparsebundle file, all you have to do is open the file, and it will mount as `/Volumes/Time Machine Backups`, then run:

```
./3_set_destination.sh
```

And enter your password if it prompts you. If you are uncomfortable blindly running scripts as super-user, I understand, read the script to make sure you know what you it is doing.

_Explanation:_ This script uses the Time Machine utility, `tmutil` to set the Time Machine destination to the `/Volumes/Time Machine Backups` mount point.

Now you can fire up Time Machine and start your backups!

