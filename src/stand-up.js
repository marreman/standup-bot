const tinyspeck = require("tinyspeck")

const CHANNEL = "#standup-channel"
const slack = tinyspeck.instance({ token: process.env.SLACK_TOKEN })

const model = {
  standup: null
}

/*
 * TODO
 * Make the message you send to standup your reply
 * Ping the channel when the starting a standup
 * If a user mentions "help" show some emoji
 **/

slack.on("/standup", data => {
  const text = `Standup started by ${data.user_name}. \`/report\` your status`

  slack
    .send({
      channel: CHANNEL,
      text: text
    })
    .then(data => {
      model.standup = {
        ts: data.ts,
        channel: data.channel,
        initialMessage: text,
        members: {}
      }
    })
})

slack.on("/report", data => {
  if (!model.standup) {
    slack.send(data.response_url, {
      channel: CHANNEL,
      text:
        "I respect your eagerness, but there's no standup going on right now! Start one with `/standup`!"
    })
  } else {
    model.standup.members[data.user_name] = data.text
    updateStandup(model.standup)
  }
})

function updateStandup(standup) {
  const members = Object.keys(standup.members).map(member => ({
    title: member,
    text: standup.members[member]
  }))

  slack
    .send({
      ts: standup.ts,
      channel: standup.channel,
      text: standup.initialMessage,
      attachments: members
    })
    .then(data => {
      console.log(data)
    })
}

slack.listen(6000)
