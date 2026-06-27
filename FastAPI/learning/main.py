from enum import IntEnum
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

api = FastAPI()

class Priority(IntEnum):
    LOW = 3
    MEDIUM = 2
    HIGH = 1

class TodoBase(BaseModel):
    todo_name: str = Field(..., min_length=3, max_length=512, description="The name of the todo item", example="Learn FastAPI")
    todo_description: str = Field(..., min_length=3, max_length=512, description="The description of the todo item", example="Learn FastAPI to build APIs")
    priority: Priority = Field(default=Priority.LOW, description="The priority of the todo item", example=Priority.MEDIUM)

class TodoCreate(TodoBase):
    pass

class Todo(TodoBase):
    todo_id: int = Field(..., description="The ID of the todo item", example=1)

class TodoUpdate(BaseModel):
    todo_name: Optional[str] = Field(None, min_length=3, max_length=512, description="The name of the todo item", example="Learn FastAPI")
    todo_description: Optional[str] = Field(None, min_length=3, max_length=512, description="The description of the todo item", example="Learn FastAPI to build APIs")
    priority: Optional[Priority] = Field(None, description="The priority of the todo item", example=Priority.MEDIUM)

all_todos = [
    Todo(todo_id=1, todo_name="Learn FastAPI", todo_description="Learn FastAPI to build APIs", priority=Priority.HIGH),
    Todo(todo_id=2, todo_name="Learn Python", todo_description="Learn Python to build APIs", priority=Priority.MEDIUM),
    Todo(todo_id=3, todo_name="Learn JavaScript", todo_description="Learn JavaScript to build APIs", priority=Priority.LOW),
    Todo(todo_id=4, todo_name="Learn React", todo_description="Learn React to build APIs", priority=Priority.MEDIUM),
    Todo(todo_id=5, todo_name="Learn Vue", todo_description="Learn Vue to build APIs", priority=Priority.LOW),
]

# GET, POST, PUT, DELETE
# GET: Retrieve data from the server
# POST: Send data to the server
# PUT: Update data on the server
# DELETE: Remove data from the server

@api.get("/")
def index():
    return {"message": "Hello World"}

@api.get("/todos/{todo_id}", response_model=Todo)
def get_todo(todo_id: int):
    for todo in all_todos:
        if todo.todo_id == todo_id:
            return todo
    raise HTTPException(status_code=404, detail="Todo not found")

@api.get("/todos", response_model=List[Todo])
def get_todos(first_n: int = None):
    if first_n is not None:
        return all_todos[:first_n]
    return all_todos
    raise HTTPException(status_code=404, detail="Todo not found")

@api.post("/todos", response_model=Todo)
def create_todo(todo: TodoCreate):
    new_todo_id = max([t.todo_id for t in all_todos]) + 1
    new_todo = Todo(
        todo_id=new_todo_id,
        todo_name=todo.todo_name,
        todo_description=todo.todo_description,
        priority=todo.priority
    )
    all_todos.append(new_todo)
    return new_todo

@api.put("/todos/{todo_id}", response_model=Todo)
def update_todo(todo_id: int, updated_todo: TodoUpdate):
    for todo in all_todos:
        if todo.todo_id == todo_id:
            if updated_todo.todo_name is not None:
                todo.todo_name = updated_todo.todo_name
            if updated_todo.todo_description is not None:
                todo.todo_description = updated_todo.todo_description
            if updated_todo.priority is not None:
                todo.priority = updated_todo.priority
            return todo
    raise HTTPException(status_code=404, detail="Todo not found")

@api.delete("/todos/{todo_id}", response_model=Todo)
def delete_todo(todo_id: int):
    for todo in all_todos:
        if todo.todo_id == todo_id:
            all_todos.remove(todo)
            return todo
    raise HTTPException(status_code=404, detail="Todo not found")