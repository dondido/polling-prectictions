var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Option = new Schema({
        votes: [String],
        desc: { 
            type: String,
            required: true,
            maxlength: 1024,
        },
        img: {
            type: String,
            maxlength: 64,
        },
    }),
    Comment = new Schema({
        userName:{ 
            type: String,
            required: true,
            maxlength: 64,
        },
        desc: { 
            type: String,
            required: true,
            maxlength: 2048,
        },
        created: {type: Date, default: Date.now},
    }),
    Poll = new Schema({
        title:{ 
            type: String,
            required: true,
            maxlength: 1024,
        },
        thumb: {
            type: String,
            maxlength: 64,
        },
        img: {
            type: String,
            maxlength: 64,
        },
        desc: { 
            type: String,
            maxlength: 2048,
        },
        url: { 
            type: String,
            required: true,
            maxlength: 512,
        },
        multi: {
            type: Boolean,
            default: false
        },
        tags: [String],
        options: [Option],
        comments: [Comment],
        created: {type: Date, default: Date.now}
    });
module.exports = mongoose.model('Poll', Poll);