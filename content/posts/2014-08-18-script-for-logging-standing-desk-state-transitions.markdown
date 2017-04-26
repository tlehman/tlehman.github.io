---
categories:
- command-line
- data
- bash
- markov-chains
- quantified-self
comments: true
date: 2014-08-18T00:00:00Z
title: script for logging standing desk state transitions
url: /blog/2014/08/18/script-for-logging-standing-desk-state-transitions/
---

At work I have an adjustible-height desk, that way it can be both a standing or a sitting desk.
In order to better understand my own usage habits, I made the [desk](https://github.com/tlehman/bin#desk) script,
 which logs state transitions.

Running `desk up` records the time that the desk was moved up into a standing position, and `desk down` records the
time the desk was moved into the sitting position. Later, when I have a few months of data, I'll do some analysis and
see what the probabilities are in the following state transition diagram:

{% img /images/blogimg/desk.png %}

The script builds a CSV file, and implements a simple interface:

```
desk up    # log transition to "up" state at current time
desk down  # log transition to "down" state at current time
desk log   # show last 5 state transitions along with time
```

Here's the source code

``` bash
log_filename="/path/to/log/file"

function create_log_file_if_not_exists {
  if [ ! -e $log_filename ]
  then
    echo "timestamp,state" > $log_filename
  fi
}

function log_new_state {
  create_log_file_if_not_exists

  local state=$1
  local timestamp=$(date --iso-8601=seconds)

  echo "$timestamp,$state" >> $log_filename
}

function show_log {
  create_log_file_if_not_exists

  echo "timestamp                 state"
  awk < $log_filename -F, 'NR > 1 {print $1"  "$2}' | tail -5
}

if [ $1 = "up" ] || [ $1 = "down" ]
then
  log_new_state $1
elif [ $1 = "log" ]
then
  show_log
else
  echo "Invalid command: $1"
  exit 1
fi
```

This will allow me to use a [Markov chain](https://en.wikipedia.org/wiki/Markov_chain) to model my sitting/standing
habits. More on markov chains in a later blog post.

On the health benefits (or problems) with standing, I am not a medical professional, but I think alternating sitting
and standing is probably better than all sitting or all standing.
