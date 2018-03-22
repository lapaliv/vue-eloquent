import {HasOne} from "./Relations/HasOne";
import {Relation} from "./Relations/Relation";
import axios from 'axios'

export class Eloquent {
  _attributes = {}
  _relations = {}

  /**
   * @param attributes
   */
  constructor(attributes) {
    this.http = {
      loading: false,
      errors: {}
    }

    this.fill(attributes)
    this.__defineRelations()
  }

  /**
   * Содержит имена полей, которые
   * @return {Array}
   * @private
   */
  _fillable() {
    return []
  }

  _casts() {
    return []
  }

  api() {
    return {}
  }

  /**
   * Наполняет модель данными
   * @param attributes
   * @private
   */
  fill(attributes) {
    attributes = attributes || {}
    for (let name of this._fillable()) {
      this._attributes[name] = attributes[name] || null
      Object.defineProperty(this, name, {
        get: function () {
          return this._attributes[name]
        },
        set(value) {
          return this._attributes[name] = value
        }
      })
    }

    // Добавляем атрибуты, которых нет в fillable
    if (Object.keys(attributes).length) {
      for (let attr in attributes) {
        if (this._attributes[attr] === undefined) {
          this._attributes[attr] = attributes[attr]
          Object.defineProperty(this, attr, {
            get: function () {
              return this._attributes[attr]
            },
            set(value) {
              throw new Error(`Property ${attr} read only`)
            }
          })
        }
      }
    }
  }

  /**
   * Создает связь один к одному
   * @param related
   * @param attribute
   * @return {*}
   */
  hasOne(related, attribute) {
    return new HasOne(related, attribute)
  }

  __defineRelations() {
    const allMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
    for (let method of allMethods) {
      if (typeof this[method] !== 'function' || method === 'constructor') {
        continue
      }

      try {
        let relation = this[method]()
        if (relation instanceof Relation) {
          Object.defineProperty(this, method, {
            get: async function () {
              if (!(this._relations[method] instanceof relation.related)) {
                if (this[relation.attribute]) {
                  this._relations[method] = await relation.find(this[relation.attribute])
                } else {
                  this._relations[method] = new relation.related()
                }
              }

              return this._relations[method]
            },
            set: function (value) {
              throw new Error(`Relation ${method} read only`)
            }
          })
        }
      } catch (e) {
      }
    }
  }

  /**
   * Сохраняет модель (создает или обновляет)
   * @return {Promise<AxiosResponse<any>>}
   */
  save() {
    if (this.id > 0) {
      return this.create()
    }

    return this.update()
  }

  /**
   * Отправляет модель на сервер для создания
   * @return {Promise<AxiosResponse<any>>}
   */
  create() {
    return this.__http(this.__getUrlForMethod('create'), 'post', this.__convertToSend())
  }

  /**
   * Отправляет модель на сервер для обновления
   * @return {Promise<AxiosResponse<any>>}
   */
  update() {
    return this.__http(this.__getUrlForMethod('update'), 'put', this.__convertToSend('put'))
  }

  /**
   * Конвертирует текущий объект для отправки на сервер
   * @return {*}
   * @private
   */
  __convertToSend(httpMethod) {
    httpMethod = httpMethod || 'post'
    // Определяем, если ли файлы в атрибутах
    let hasFiles = false
    for (let key in this._attributes) {
      if (this._attributes[key] instanceof File) {
        hasFiles = true
        break
      }
    }

    if (hasFiles) {
      let form = new FormData()
      for (let key in this._attributes) {
        form.append(key, this._attributes[key])
      }

      if (httpMethod !== 'post') {
        form.append('_method', httpMethod)
      }

      return form
    }

    let attributes = Object.assign({}, this._attributes)
    if (httpMethod !== 'post') {
      attributes._method = httpMethod
    }
    return attributes
  }

  /**
   * Формирует и возаращает url для указанного метода
   * @param method
   * @return {*}
   * @private
   */
  __getUrlForMethod(method) {
    let url = (this.api()._base || '') + this.api()[method]
    if (typeof url === 'undefined') {
      throw new Error(`Api method ${method} is undefined`)
    }

    const matches = url.match(/:[a-z]+/ig)
    if (Array.isArray(matches)) {
      for (let attr in this._attributes) {
        if (this._attributes[attr] && matches.indexOf(`:${attr}`) >= 0) {
          url = url.replace(`:${attr}`, this._attributes[attr])
        }
      }
    }

    return url
  }

  /**
   * Делает запрос на нахождение модели
   * @return {Promise<AxiosResponse<any>>}
   */
  static async first(id) {
    let model = new this
    const url = model.api().first
      ? model.__getUrlForMethod('first')
      : model.__getUrlForMethod('find')

    await model.__http(url)
      .then((res) => {
        model.fill(res)
      })
    return model
  }

  /**
   * Отправляет http-запрос
   * @param url
   * @param method
   * @param data
   * @return {Promise<AxiosResponse<any>>}
   * @private
   */
  __http(url, method, data) {
    method = method || 'get'
    data = data || {}

    // this.http.loading = true
    const resolve = function (res) {
      // this.http.loading = false
      // this.http.errors = {}

      return res.data
    }

    const reject = function (res) {
      // this.http.loading = false
      // this.http.errors = res.response.data.errors

      throw res && res.response || res
    }

    if (method === 'get') {
      return axios.get(url, {params: data})
        .then(resolve.bind(this))
        .catch(reject().bind(this))
    }

    return axios.post(url, {
      data,
      responseType: data instanceof FormData ? 'multipart/form-data' : 'json'
    })
      .then(resolve.bind(this))
      .catch(reject().bind(this))
  }

  /**
   * Делает запрос на нахождение модели
   * @return {Promise<AxiosResponse<any>>}
   */
  static async find(id) {
    return await this.first(id)
  }
}
