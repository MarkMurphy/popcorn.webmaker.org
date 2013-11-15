#!/bin/sh

cmd="start"
dir="~/Documents"
screenflag="no"

while [ $# -gt 0 ]
do
  case "$1" in
    "start")  cmd="start";;
    "stop")   cmd="stop";;
    -s)       screenflag="yes";;
    -d)       dir="$2"; shift;;
    --)       shift; break;;
    -*)       echo "$0: error - unrecognized option $1" 1>&2; exit 1;;
  esac
  shift
done

function start {
  local title=$1
  local cmd=$2

  if [ $screenflag == "yes" ]; then
    screen -dmS $title && screen -S $title -X screen $cmd
  else
    osascript \
    -e "tell application \"Terminal\" to activate" \
    -e "tell application \"System Events\" to keystroke \"t\" using {command down}" \
    -e "tell application \"Terminal\" to set custom title of front window to \"$title\"" \
    -e "tell application \"Terminal\" to do script \"$cmd\" in selected tab of the front window" >/dev/null
  fi 

  sleep 1
}

function stop {
  if [ $screenflag == "yes" ]; then
    screen -S $title -X quit
  fi
}

case $cmd in
  "stop")
    printf "Stopping..."
    stop "MongoDB"
    stop "ElasticSearch"
    stop "WebmakerLoginAPI"
    stop "Webmaker"
    stop "MakeAPI"
    stop "Popcorn"
    echo "Done."
    ;;

  "start" | *)
    printf "Starting..."
    start "MongoDB"           "mongod"
    start "ElasticSearch"     "elasticsearch -f"
    start "WebmakerLoginAPI"  "cd ${dir}/login.webmaker.org && foreman start -f Procfile"
    start "Webmaker"          "cd ${dir}/webmaker.org && foreman start -f Procfile"
    start "MakeAPI"           "cd ${dir}/MakeAPI && node server"
    start "Popcorn"           "cd ${dir}/popcorn.webmaker.org && node server"
    echo "Done."
    ;;
esac

