var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Option = new Schema({
        votes: [String],
        desc: { 
            type: String,
            required: true,
            maxlength: 1024,
        },
        media: {
            type: String,
            maxlength: 128,
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
        appendix:{ 
            type: String,
            required: true,
            maxlength: 1024,
        },
        thumb: {
            type: String,
            maxlength: 64,
        },
        folder: Number,
        media: {
            type: String,
            maxlength: 128,
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
        expire: Date,
        created: {type: Date, default: Date.now}
    });
module.exports = mongoose.model('Poll', Poll);