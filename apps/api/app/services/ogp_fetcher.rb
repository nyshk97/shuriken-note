# frozen_string_literal: true

require 'net/http'
require 'nokogiri'
require 'resolv'
require 'ipaddr'

class OgpFetcher
  Result = Data.define(:title, :description, :image, :favicon, :site_name, :url)

  TIMEOUT = 5
  MAX_REDIRECTS = 3
  MAX_BODY_SIZE = 1_048_576 # 1 MB
  USER_AGENT = 'Mozilla/5.0 (compatible; ShurikenNote/1.0)'

  def initialize(url:)
    @url = url
  end

  def call
    uri = parse_and_validate_url!(@url)
    html = fetch_html(uri)
    meta = parse_meta(html, uri)

    Result.new(url: @url, **meta)
  end

  private

  def parse_and_validate_url!(raw)
    uri = URI.parse(raw)
    raise ArgumentError, 'URL scheme must be http or https' unless %w[http https].include?(uri.scheme)
    raise ArgumentError, 'URL must have a host' if uri.host.blank?

    resolved = Resolv.getaddress(uri.host)
    ip = IPAddr.new(resolved)
    raise ArgumentError, 'Internal URLs are not allowed' if ip.private? || ip.loopback? || ip.link_local?

    uri
  end

  def fetch_html(uri, redirect_count = 0)
    raise ArgumentError, 'Too many redirects' if redirect_count > MAX_REDIRECTS

    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = uri.scheme == 'https'
    http.open_timeout = TIMEOUT
    http.read_timeout = TIMEOUT

    request = Net::HTTP::Get.new(uri)
    request['User-Agent'] = USER_AGENT
    request['Accept'] = 'text/html'

    response = http.request(request)

    case response
    when Net::HTTPRedirection
      location = response['location']
      redirect_uri = URI.parse(location)
      redirect_uri = URI.join(uri, location) unless redirect_uri.host
      parse_and_validate_url!(redirect_uri.to_s)
      fetch_html(redirect_uri, redirect_count + 1)
    when Net::HTTPSuccess
      body = response.body
      raise 'Response too large' if body.bytesize > MAX_BODY_SIZE
      body.force_encoding('UTF-8')
    else
      raise "HTTP #{response.code}"
    end
  end

  def parse_meta(html, uri)
    doc = Nokogiri::HTML(html)

    title = meta_content(doc, 'meta[property="og:title"]') ||
            doc.at('title')&.text&.strip

    description = meta_content(doc, 'meta[property="og:description"]') ||
                  meta_content(doc, 'meta[name="description"]')

    image = meta_content(doc, 'meta[property="og:image"]')

    site_name = meta_content(doc, 'meta[property="og:site_name"]')

    favicon = doc.at('link[rel="icon"]')&.[]('href') ||
              doc.at('link[rel="shortcut icon"]')&.[]('href') ||
              "#{uri.scheme}://#{uri.host}/favicon.ico"

    {
      title: title&.truncate(200),
      description: description&.truncate(300),
      image: resolve_url(image, uri),
      favicon: resolve_url(favicon, uri),
      site_name: site_name
    }
  end

  def meta_content(doc, selector)
    doc.at(selector)&.[]('content')&.strip.presence
  end

  def resolve_url(url, base_uri)
    return nil if url.blank?
    return url if url.start_with?('http://', 'https://')

    URI.join(base_uri, url).to_s
  rescue URI::InvalidURIError
    nil
  end
end
