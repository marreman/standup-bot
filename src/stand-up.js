const tinyspeck = require("tinyspeck")
const command = process.env.NODE_ENV === "production" ? "/standup" : "/standup-dev"

const slack = tinyspeck.instance({ token: process.env.SLACK_TOKEN })

/*
 * TODO
 * Clear the standup after 5 mins
 * If a user mentions "help" show some emoji
 **/

const model = {
  standups: {}
}

slack.on(command, message => {
  const standup = findStandUp(message, model.standups)

  if (standup) {
    updateStandUp(message, standup).then(saveStandUp).then(viewStandUp)
  } else {
    createStandUp(message).then(saveStandUp).then(viewStandUp)
  }
})

function findStandUp(message, standups) {
  return standups[message.channel_id]
}

function saveStandUp(standup) {
  model.standups[standup.channel] = standup
  return standup
}

function createStandUp(message) {
  const text = "<!channel> reply with `/standup [your message]`"

  return slack
    .send({
      channel: message.channel_id,
      text: text
    })
    .then(data => {
      return {
        text: text,
        channel: data.channel,
        timestamp: data.ts,
        replies: {
          [message.user_name]: message.text
        }
      }
    })
}

function updateStandUp(message, standup) {
  standup.replies[message.user_name] = message.text
  return Promise.resolve(standup)
}

function viewStandUp(standup) {
  const replies = Object.keys(standup.replies).map(user => ({
    title: user,
    text: standup.replies[user]
  }))

  return slack.send({
    ts: standup.timestamp,
    channel: standup.channel,
    text: standup.text,
    attachments: replies
  })
}

slack.listen(process.env.PORT || 6000)
