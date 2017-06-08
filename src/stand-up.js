const tinyspeck = require("tinyspeck")
const command = process.env.NODE_ENV === "production" ? "/standup" : "/standup-dev"

const slack = tinyspeck.instance({ token: process.env.SLACK_TOKEN })

/*
 * TODO
 * Support multiple channels
 * Clear the standup after 5 mins
 * If a user mentions "help" show some emoji
 **/

const model = {
  standup: null
}

slack.on(command, message => {
  if (!model.standup) {
    createStandUp(message).then(viewStandUp)
  } else {
    updateStandUp(message).then(viewStandUp)
  }
})

function createStandUp(message) {
  const text = "<!channel> reply with `/standup [your message]`"

  return slack
    .send({
      channel: message.channel_id,
      text: text
    })
    .then(data => {
      model.standup = {
        text: text,
        channel: data.channel,
        timestamp: data.ts,
        replies: {
          [message.user_name]: message.text
        }
      }
    })
}

function updateStandUp(message) {
  model.standup.replies[message.user_name] = message.text
  return Promise.resolve()
}

function viewStandUp() {
  const replies = Object.keys(model.standup.replies).map(user => ({
    title: user,
    text: model.standup.replies[user]
  }))

  return slack.send({
    ts: model.standup.timestamp,
    channel: model.standup.channel,
    text: model.standup.text,
    attachments: replies
  })
}

slack.listen(process.env.PORT || 6000)
