const express = require('express')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const path = require('path')
const format = require('date-fns/format')
const isValid = require('date-fns/isValid')

const app = express()
app.use(express.json())

const dbpath = path.join(__dirname, 'todoApplication.db')
let db = null

const initializedb = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Successfully Running')
    })
  } catch (e) {
    console.log(`${e.message}`)
    process.exit(1)
  }
}
initializedb()

//logger ---1
const querylogger = (request, response, next) => {
  const {category, search_q, priority, status, date} = request.query
  const todostatus = ['TO DO', 'IN PROGRESS', 'DONE']
  if (status !== undefined) {
    if (todostatus.includes(status)) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }
  if (priority !== undefined) {
    const todopriority = ['HIGH', 'MEDIUM', 'LOW']
    if (todopriority.includes(priority)) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
  }
  if (category !== undefined) {
    const todocategory = ['WORK', 'HOME', 'LEARNING']
    if (todocategory.includes(category)) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }
  if (date !== undefined) {
    try {
      const formateddate = format(new Date(date), 'yyyy-MM-dd')
      const result = isValid(new Date(formateddate))
      console.log(result)
      if (result) {
        request.date = formateddate
      } else {
        response.status(400)
        response.send('Invalid Due Date')
        return
      }
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }

  request.search_q = search_q
  next()
}

const bodylogger = (request, response, next) => {
  const {todoId} = request.params
  const {id, todo, category, priority, status, dueDate} = request.body
  const todostatus = ['TO DO', 'IN PROGRESS', 'DONE']
  if (status !== undefined) {
    if (todostatus.includes(status)) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }
  if (priority !== undefined) {
    const todopriority = ['HIGH', 'MEDIUM', 'LOW']
    if (todopriority.includes(priority)) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
  }
  if (category !== undefined) {
    const todocategory = ['WORK', 'HOME', 'LEARNING']
    if (todocategory.includes(category)) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }

  if (dueDate !== undefined) {
    try {
      const formatedDate = format(new Date(dueDate), 'yyyy-MM-dd')
      console.log(formatedDate)

      const isValidDate = isValid(new Date(formatedDate))
      console.log(isValidDate)
      console.log(isValidDate)
      if (isValidDate === true) {
        request.dueDate = formatedDate
      } else {
        response.status(400)
        response.send('Invalid Due Date')
        return
      }
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }

  request.todo = todo
  request.id = id
  request.todoId = todoId
  next()
}

//get todos ----Api-1
app.get('/todos/', querylogger, async (request, response) => {
  try {
    const {status = '', priority = '', search_q = '', category = ''} = request
    const dbquery = `
        select * from todo where priority like '%${priority}%' and status like '%${status}%'
        and todo like '%${search_q}%' and category like '%${category}%'`
    const dbresponse = await db.all(dbquery)
    const changeobj = dbobj => {
      return {
        id: dbobj.id,
        todo: dbobj.todo,
        priority: dbobj.priority,
        status: dbobj.status,
        category: dbobj.category,
        dueDate: dbobj.due_date,
      }
    }
    response.send(dbresponse.map(each => changeobj(each)))
  } catch (e) {
    console.log(`${e.message}`)
  }
})

//get todo based on id -----Api-2
app.get('/todos/:todoId/', bodylogger, async (request, response) => {
  try {
    const {todoId} = request

    const dbquery = `
        select * from todo where id=${todoId};`
    const dbresponse = await db.get(dbquery)
    const changeobj = dbobj => {
      return {
        id: dbobj.id,
        todo: dbobj.todo,
        priority: dbobj.priority,
        status: dbobj.status,
        category: dbobj.category,
        dueDate: dbobj.due_date,
      }
    }
    response.send(changeobj(dbresponse))
    console.log(dbresponse)
  } catch (e) {
    console.log(`${e.message}`)
  }
})

//get based on date ---Api-3
app.get('/agenda/', querylogger, async (request, response) => {
  try {
    const {date} = request
    console.log(date)
    const dbquery = `
        select * from todo where due_date like '%${date}%'`
    const dbresponse = await db.all(dbquery)
    const changeobj = dbobj => {
      return {
        id: dbobj.id,
        todo: dbobj.todo,
        priority: dbobj.priority,
        status: dbobj.status,
        category: dbobj.category,
        dueDate: dbobj.due_date,
      }
    }
    response.send(dbresponse.map(each => changeobj(each)))
  } catch (e) {
    console.log(`${e.message}`)
  }
})

//post todo
app.post('/todos/', bodylogger, async (request, response) => {
  try {
    const {id, todo, priority, status, category, dueDate} = request
    const dbquery = `
        insert into todo (id,todo,category,priority,status,due_date)
        values (${id},'${todo}','${category}','${priority}','${status}','${dueDate}')`
    await db.run(dbquery)
    response.send('Todo Successfully Added')
  } catch (e) {
    console.log(`${e.message}`)
  }
})

//update details----Api-5
app.put('/todos/:todoId/', bodylogger, async (request, response) => {
  try {
    const {todoId} = request
    const {status, priority, todo, category, dueDate} = request
    if (status !== undefined) {
      const dbquery = `
        update todo 
        set status="${status}"
        where id=${todoId};`
      await db.run(dbquery)
      response.send('Status Updated')
    } else if (priority !== undefined) {
      const dbquery = `
        update todo 
        set priority="${priority}"
        where id=${todoId};`
      await db.run(dbquery)
      response.send('Priority Updated')
    } else if (todo !== undefined) {
      const dbquery = `
        update todo 
        set todo="${todo}"
        where id=${todoId};`
      await db.run(dbquery)
      response.send('Todo Updated')
    } else if (category !== undefined) {
      const dbquery = `
        update todo 
        set category="${category}"
        where id=${todoId};`
      await db.run(dbquery)
      response.send('Category Updated')
    } else if (dueDate !== undefined) {
      const dbquery = `
        update todo 
        set due_date="${dueDate}"
        where id=${todoId};`
      await db.run(dbquery)
      response.send('Due Date Updated')
    }
  } catch (e) {
    console.log(`${e.message}`)
  }
})

//delete todo ---Api-6
app.delete('/todos/:todoId/', async (request, response) => {
  try {
    const {todoId} = request.params

    console.log(request.params)
    const dbquery = `
        delete from todo where id=${todoId};`
    await db.run(dbquery)
    response.send('Todo Deleted')
  } catch (e) {
    console.log(`${e.message}`)
  }
})
module.exports = app
