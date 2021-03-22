import React from 'react';
import PropTypes from 'prop-types';
import MessageCard from './MessageCard'

export default function Messages({ messages, didContract }) {

  return (
    <>
      <h2>Messages</h2>
      {messages.map((message, i) => 
        <MessageCard 
          key={i}
          didContract={didContract}
          sender={message.sender}
          text={message.text}
          premium={message.premium}
        />
      )}
    </>
    )
}

Messages.propTypes = {
  messages: PropTypes.array
};
